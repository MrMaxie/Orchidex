use crate::models::{
    default_graph, default_source_port, Graph, IgniteSparkRequest, NodeCatalogResponse, NodeStatus,
    ResolveManualGateRequest, RunHistoryEntry, RuntimeDiagnostic, RuntimeEvent, RuntimeSnapshot,
    Spark, SparkStatus, SparkTraceStep,
};
use crate::nodes::{
    discover_node_catalog, execute_rhai_file_with_context, NodeExecutionHost, NodeExecutionStatus,
    NodeRegistry,
};
use crate::runtime_store::RuntimeStore;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use thiserror::Error;
use tokio::sync::broadcast;
use tokio::time::{sleep, Duration};
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum RuntimeError {
    #[error("node '{0}' does not exist")]
    MissingNode(String),
    #[error("graph validation failed: {0}")]
    InvalidGraph(String),
    #[error("failed to load node registry: {0}")]
    NodeRegistry(String),
    #[error("runtime lock is poisoned")]
    LockPoisoned,
}

#[derive(Clone)]
pub struct RuntimeHandle {
    state: Arc<Mutex<RuntimeState>>,
    tx: broadcast::Sender<RuntimeEvent>,
    store: RuntimeStore,
}

#[derive(Debug)]
struct RuntimeState {
    graph: Graph,
    sparks: HashMap<String, Spark>,
    run_history: Vec<RunHistoryEntry>,
    diagnostics: Vec<RuntimeDiagnostic>,
    traces: HashMap<String, Vec<SparkTraceStep>>,
    cache_store: HashMap<String, serde_json::Value>,
    freezer_store: HashMap<String, serde_json::Value>,
    epoch: u64,
}

impl RuntimeHandle {
    pub fn new(graph: Graph) -> Self {
        Self::with_store(graph, RuntimeStore::new(workspace_runtime_dir()))
    }

    fn with_store(graph: Graph, store: RuntimeStore) -> Self {
        let (tx, _) = broadcast::channel(256);
        let restored = store.load_snapshot().ok().flatten();
        let state = restored
            .map(|snapshot| RuntimeState {
                graph: snapshot.graph,
                sparks: snapshot
                    .active_sparks
                    .into_iter()
                    .map(|spark| (spark.id.clone(), spark))
                    .collect(),
                run_history: snapshot.run_history,
                diagnostics: snapshot.diagnostics,
                traces: snapshot.traces.into_iter().fold(
                    HashMap::<String, Vec<SparkTraceStep>>::new(),
                    |mut acc, step| {
                        acc.entry(step.spark_id.clone()).or_default().push(step);
                        acc
                    },
                ),
                cache_store: snapshot.cache_entries.into_iter().collect(),
                freezer_store: snapshot.freezer_entries.into_iter().collect(),
                epoch: 0,
            })
            .unwrap_or(RuntimeState {
                graph,
                sparks: HashMap::new(),
                run_history: Vec::new(),
                diagnostics: Vec::new(),
                traces: HashMap::new(),
                cache_store: HashMap::new(),
                freezer_store: HashMap::new(),
                epoch: 0,
            });
        Self {
            state: Arc::new(Mutex::new(state)),
            tx,
            store,
        }
    }

    pub fn demo() -> Self {
        Self::new(default_graph())
    }

    pub fn ephemeral(graph: Graph) -> Self {
        let suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock should be available")
            .as_nanos();
        Self::with_store(
            graph,
            RuntimeStore::new(std::env::temp_dir().join(format!("orchidex-runtime-{suffix}"))),
        )
    }

    pub fn graph(&self) -> Result<Graph, RuntimeError> {
        let state = self.state.lock().map_err(|_| RuntimeError::LockPoisoned)?;
        Ok(state.graph.clone())
    }

    pub fn replace_graph(&self, graph: Graph) -> Result<Graph, RuntimeError> {
        self.validate_graph(&graph)?;
        let mut events = vec![RuntimeEvent::GraphUpdated {
            graph: graph.clone(),
        }];
        {
            let mut state = self.state.lock().map_err(|_| RuntimeError::LockPoisoned)?;
            state.graph = graph.clone();
            let node_ids: Vec<_> = state
                .graph
                .nodes
                .iter()
                .map(|node| node.id.clone())
                .collect();
            for spark in state.sparks.values_mut() {
                if spark.status == SparkStatus::Active
                    && !node_ids
                        .iter()
                        .any(|node_id| node_id == &spark.current_node_id)
                {
                    spark.status = SparkStatus::Blocked;
                    events.push(RuntimeEvent::SparkBlocked {
                        spark_id: spark.id.clone(),
                        reason: "current node was removed during a live edit".to_owned(),
                    });
                }
            }
        }
        self.emit_many(events);
        Ok(graph)
    }

    pub fn ignite(&self, request: IgniteSparkRequest) -> Result<Spark, RuntimeError> {
        self.validate_graph(&self.graph()?)?;
        let (spark, epoch) = {
            let mut state = self.state.lock().map_err(|_| RuntimeError::LockPoisoned)?;
            if !state
                .graph
                .nodes
                .iter()
                .any(|node| node.id == request.node_id)
            {
                return Err(RuntimeError::MissingNode(request.node_id));
            }

            let spark = Spark {
                id: Uuid::new_v4().to_string(),
                current_node_id: request.node_id,
                payload: request.payload,
                status: SparkStatus::Active,
            };
            let epoch = state.epoch;
            state.sparks.insert(spark.id.clone(), spark.clone());
            (spark, epoch)
        };

        self.emit(RuntimeEvent::SparkIgnited {
            spark: spark.clone(),
        });
        self.emit(RuntimeEvent::NodeStatusChanged {
            node_id: spark.current_node_id.clone(),
            status: NodeStatus::Running,
        });

        let runtime = self.clone();
        let spark_id = spark.id.clone();
        tokio::spawn(async move {
            runtime.drive_spark(spark_id, epoch).await;
        });

        Ok(spark)
    }

    pub fn extinguish_all(&self) -> Result<usize, RuntimeError> {
        let mut extinguished = 0;
        let mut events = Vec::new();
        {
            let mut state = self.state.lock().map_err(|_| RuntimeError::LockPoisoned)?;
            state.epoch += 1;
            for spark in state.sparks.values_mut() {
                if spark.status == SparkStatus::Active {
                    spark.status = SparkStatus::Extinguished;
                    extinguished += 1;
                    events.push(RuntimeEvent::SparkExtinguished {
                        spark_id: spark.id.clone(),
                    });
                }
            }
        }
        events.push(RuntimeEvent::AllSparksExtinguished);
        self.emit_many(events);
        Ok(extinguished)
    }

    pub fn release_queue(&self, node_id: &str) -> Result<usize, RuntimeError> {
        let (released_ids, epoch, node_id) = {
            let mut state = self.state.lock().map_err(|_| RuntimeError::LockPoisoned)?;
            let Some(node) = state.graph.nodes.iter_mut().find(|node| node.id == node_id) else {
                return Err(RuntimeError::MissingNode(node_id.to_owned()));
            };
            node.config["locked"] = serde_json::json!(false);

            let mut released_ids = Vec::new();
            for spark in state.sparks.values_mut() {
                if spark.current_node_id == node_id && spark.status == SparkStatus::Blocked {
                    spark.status = SparkStatus::Active;
                    spark.payload["queueReleased"] = serde_json::json!(true);
                    released_ids.push(spark.id.clone());
                }
            }
            let epoch = state.epoch;
            self.persist_state(&state)?;
            (released_ids, epoch, node_id.to_owned())
        };

        self.emit(RuntimeEvent::QueueChanged {
            node_id: node_id.clone(),
            released: true,
        });
        self.emit(RuntimeEvent::NodeStatusChanged {
            node_id: node_id.clone(),
            status: NodeStatus::Running,
        });

        for spark_id in &released_ids {
            let runtime = self.clone();
            let spark_id = spark_id.clone();
            tokio::spawn(async move {
                runtime.drive_spark(spark_id, epoch).await;
            });
        }

        Ok(released_ids.len())
    }

    pub fn resolve_manual_gate(&self, request: ResolveManualGateRequest) -> Result<Spark, RuntimeError> {
        let (spark, epoch) = {
            let mut state = self.state.lock().map_err(|_| RuntimeError::LockPoisoned)?;
            let graph_id = state.graph.id.clone();
            let Some(mut spark) = state.sparks.remove(&request.spark_id) else {
                return Err(RuntimeError::MissingNode(request.spark_id));
            };

            let mut payload = request.payload.unwrap_or_else(|| spark.payload.clone());
            payload["manualAccepted"] = serde_json::json!(true);
            spark.payload = payload;
            spark.status = SparkStatus::Active;

            let node_id = spark.current_node_id.clone();
            state.run_history.push(RunHistoryEntry {
                spark_id: spark.id.clone(),
                graph_id,
                final_status: SparkStatus::Active,
                last_node_id: node_id.clone(),
                reason: Some("manual gate resolved".to_owned()),
            });
            state
                .traces
                .entry(spark.id.clone())
                .or_default()
                .push(SparkTraceStep {
                    spark_id: spark.id.clone(),
                    node_id: node_id.clone(),
                    event: "manual-resolved".to_owned(),
                    edge_id: None,
                    reason: Some("manual gate resolved".to_owned()),
                });
            let spark_clone = spark.clone();
            let epoch = state.epoch;
            state.sparks.insert(spark.id.clone(), spark);
            self.persist_state(&state)?;
            (spark_clone, epoch)
        };

        self.emit(RuntimeEvent::ManualGateChanged {
            spark_id: spark.id.clone(),
            node_id: spark.current_node_id.clone(),
            resolved: true,
        });
        self.emit(RuntimeEvent::NodeStatusChanged {
            node_id: spark.current_node_id.clone(),
            status: NodeStatus::Running,
        });

        let runtime = self.clone();
        let spark_id = spark.id.clone();
        tokio::spawn(async move {
            runtime.drive_spark(spark_id, epoch).await;
        });

        Ok(spark)
    }

    pub fn subscribe(&self) -> broadcast::Receiver<RuntimeEvent> {
        self.tx.subscribe()
    }

    pub fn node_catalog(&self) -> NodeCatalogResponse {
        discover_node_catalog(workspace_nodes_dir())
    }

    pub fn run_history(&self) -> Result<Vec<RunHistoryEntry>, RuntimeError> {
        let state = self.state.lock().map_err(|_| RuntimeError::LockPoisoned)?;
        Ok(state.run_history.clone())
    }

    pub fn diagnostics(&self) -> Result<Vec<RuntimeDiagnostic>, RuntimeError> {
        let state = self.state.lock().map_err(|_| RuntimeError::LockPoisoned)?;
        Ok(state.diagnostics.clone())
    }

    pub fn traces(&self) -> Result<Vec<SparkTraceStep>, RuntimeError> {
        let state = self.state.lock().map_err(|_| RuntimeError::LockPoisoned)?;
        Ok(state
            .traces
            .values()
            .flat_map(|steps| steps.iter().cloned())
            .collect())
    }

    fn validate_graph(&self, graph: &Graph) -> Result<(), RuntimeError> {
        let registry = NodeRegistry::load_from(workspace_nodes_dir())
            .map_err(|error| RuntimeError::NodeRegistry(error.to_string()))?;
        let diagnostics = registry.validate_graph_edges(graph);
        if diagnostics.is_empty() {
            return Ok(());
        }

        let summary = diagnostics
            .into_iter()
            .map(|diagnostic| format!("{}: {}", diagnostic.edge_id, diagnostic.message))
            .collect::<Vec<_>>()
            .join("; ");
        Err(RuntimeError::InvalidGraph(summary))
    }

    async fn drive_spark(&self, spark_id: String, epoch: u64) {
        loop {
            sleep(Duration::from_millis(180)).await;
            let next = self.advance_once(&spark_id, epoch);
            match next {
                Ok(AdvanceOutcome::Continue) => {}
                Ok(AdvanceOutcome::Finished) | Err(_) => break,
            }
        }
    }

    fn advance_once(&self, spark_id: &str, epoch: u64) -> Result<AdvanceOutcome, RuntimeError> {
        let registry = NodeRegistry::load_from(workspace_nodes_dir())
            .map_err(|error| RuntimeError::NodeRegistry(error.to_string()))?;
        let mut events = Vec::new();
        let execution = {
            let mut state = self.state.lock().map_err(|_| RuntimeError::LockPoisoned)?;
            if state.epoch != epoch {
                return Ok(AdvanceOutcome::Finished);
            }

            let Some(current) = state.sparks.get(spark_id).cloned() else {
                return Ok(AdvanceOutcome::Finished);
            };

            if current.status != SparkStatus::Active {
                return Ok(AdvanceOutcome::Finished);
            }

            let Some(node) = state
                .graph
                .nodes
                .iter()
                .find(|node| node.id == current.current_node_id)
                .cloned()
            else {
                let graph_id = state.graph.id.clone();
                if let Some(spark) = state.sparks.get_mut(spark_id) {
                    spark.status = SparkStatus::Blocked;
                }
                state.diagnostics.push(RuntimeDiagnostic {
                    kind: "missing-node".to_owned(),
                    message: "current node is missing".to_owned(),
                    graph_id,
                    spark_id: Some(spark_id.to_owned()),
                    node_id: Some(current.current_node_id.clone()),
                    context: Default::default(),
                });
                events.push(RuntimeEvent::SparkBlocked {
                    spark_id: spark_id.to_owned(),
                    reason: "current node is missing".to_owned(),
                });
                events.push(RuntimeEvent::DiagnosticRecorded {
                    diagnostic: RuntimeDiagnostic {
                        kind: "missing-node".to_owned(),
                        message: "current node is missing".to_owned(),
                        graph_id: state.graph.id.clone(),
                        spark_id: Some(spark_id.to_owned()),
                        node_id: Some(current.current_node_id.clone()),
                        context: Default::default(),
                    },
                });
                self.persist_state(&state)?;
                return Ok(AdvanceOutcome::Finished);
            };

            state
                .traces
                .entry(current.id.clone())
                .or_default()
                .push(SparkTraceStep {
                    spark_id: current.id.clone(),
                    node_id: node.id.clone(),
                    event: "entered".to_owned(),
                    edge_id: None,
                    reason: None,
                });

            let host = NodeExecutionHost {
                cache_entries: state.cache_store.clone().into_iter().collect(),
                freezer_entries: state.freezer_store.clone().into_iter().collect(),
                fixture_root: workspace_root_dir(),
            };
            (current, node, state.graph.clone(), host)
        };

        let (current, node, graph, host) = execution;
        let manifest = registry
            .get(&node.kind)
            .ok_or_else(|| RuntimeError::MissingNode(node.kind.clone()))?;
        let entrypoint_path = registry
            .entrypoint_path(&node.kind)
            .ok_or_else(|| RuntimeError::MissingNode(node.kind.clone()))?;
        let result = execute_rhai_file_with_context(
            entrypoint_path,
            current.payload.clone(),
            node.config.clone(),
            &host,
        )
        .map_err(|error| RuntimeError::InvalidGraph(error.to_string()))?;

        let route_port = result.route.clone().unwrap_or_else(default_source_port);
        let next_edge = graph
            .edges
            .iter()
            .find(|edge| edge.source == current.current_node_id && edge.source_port == route_port)
            .cloned();

        let outcome = {
            let mut state = self.state.lock().map_err(|_| RuntimeError::LockPoisoned)?;
            if state.epoch != epoch {
                return Ok(AdvanceOutcome::Finished);
            }
            for (key, value) in &result.cache_writes {
                state.cache_store.insert(key.clone(), value.clone());
            }
            for (key, value) in &result.freezer_writes {
                state.freezer_store.insert(key.clone(), value.clone());
            }
            let graph_id = graph.id.clone();
            for message in &result.diagnostics {
                state.diagnostics.push(RuntimeDiagnostic {
                    kind: "node-diagnostic".to_owned(),
                    message: message.clone(),
                    graph_id: graph_id.clone(),
                    spark_id: Some(spark_id.to_owned()),
                    node_id: Some(current.current_node_id.clone()),
                    context: Default::default(),
                });
                events.push(RuntimeEvent::DiagnosticRecorded {
                    diagnostic: RuntimeDiagnostic {
                        kind: "node-diagnostic".to_owned(),
                        message: message.clone(),
                        graph_id: graph_id.clone(),
                        spark_id: Some(spark_id.to_owned()),
                        node_id: Some(current.current_node_id.clone()),
                        context: Default::default(),
                    },
                });
            }
            let Some(mut spark) = state.sparks.remove(spark_id) else {
                return Ok(AdvanceOutcome::Finished);
            };
            if spark.status != SparkStatus::Active {
                state.sparks.insert(spark.id.clone(), spark);
                return Ok(AdvanceOutcome::Finished);
            }

            spark.payload = result.payload.clone();

            for message in &result.logs {
                events.push(RuntimeEvent::Log {
                    node_id: current.current_node_id.clone(),
                    message: message.clone(),
                });
            }
            for message in &result.diagnostics {
                events.push(RuntimeEvent::Log {
                    node_id: current.current_node_id.clone(),
                    message: format!("diagnostic: {message}"),
                });
            }

            match result.status {
                NodeExecutionStatus::Continue => {
                    if let Some(edge) = next_edge {
                        if !graph.nodes.iter().any(|candidate| candidate.id == edge.target) {
                            spark.status = SparkStatus::Blocked;
                            state.run_history.push(RunHistoryEntry {
                                spark_id: spark_id.to_owned(),
                                graph_id: graph.id.clone(),
                                final_status: SparkStatus::Blocked,
                                last_node_id: current.current_node_id.clone(),
                                reason: Some(format!("edge '{}' points to a missing node", edge.id)),
                            });
                            events.push(RuntimeEvent::NodeStatusChanged {
                                node_id: current.current_node_id.clone(),
                                status: NodeStatus::Blocked,
                            });
                            events.push(RuntimeEvent::SparkBlocked {
                                spark_id: spark_id.to_owned(),
                                reason: format!("edge '{}' points to a missing node", edge.id),
                            });
                            events.push(RuntimeEvent::SparkFailed {
                                spark_id: spark_id.to_owned(),
                                node_id: current.current_node_id.clone(),
                                reason: format!("edge '{}' points to a missing node", edge.id),
                            });
                            state
                                .traces
                                .entry(spark_id.to_owned())
                                .or_default()
                                .push(SparkTraceStep {
                                    spark_id: spark_id.to_owned(),
                                    node_id: current.current_node_id.clone(),
                                    event: "blocked".to_owned(),
                                    edge_id: Some(edge.id),
                                    reason: Some("missing target node".to_owned()),
                                });
                            state.sparks.insert(spark.id.clone(), spark);
                            self.persist_state(&state)?;
                            AdvanceOutcome::Finished
                        } else {
                            spark.current_node_id = edge.target.clone();
                            events.push(RuntimeEvent::NodeStatusChanged {
                                node_id: current.current_node_id.clone(),
                                status: NodeStatus::Done,
                            });
                            events.push(RuntimeEvent::SparkMoved {
                                spark_id: spark_id.to_owned(),
                                from_node_id: current.current_node_id.clone(),
                                to_node_id: edge.target.clone(),
                                edge_id: edge.id.clone(),
                            });
                            events.push(RuntimeEvent::NodeStatusChanged {
                                node_id: edge.target,
                                status: NodeStatus::Running,
                            });
                            state
                                .traces
                                .entry(spark_id.to_owned())
                                .or_default()
                                .push(SparkTraceStep {
                                    spark_id: spark_id.to_owned(),
                                    node_id: current.current_node_id.clone(),
                                    event: "moved".to_owned(),
                                    edge_id: Some(edge.id),
                                    reason: None,
                                });
                            state.sparks.insert(spark.id.clone(), spark);
                            self.persist_state(&state)?;
                            AdvanceOutcome::Continue
                        }
                    } else if manifest.output_ports.is_empty() {
                        spark.status = SparkStatus::Completed;
                        state.run_history.push(RunHistoryEntry {
                            spark_id: spark_id.to_owned(),
                            graph_id: graph.id.clone(),
                            final_status: SparkStatus::Completed,
                            last_node_id: current.current_node_id.clone(),
                            reason: Some("node completed without outputs".to_owned()),
                        });
                        events.push(RuntimeEvent::NodeStatusChanged {
                            node_id: current.current_node_id.clone(),
                            status: NodeStatus::Done,
                        });
                        state
                            .traces
                            .entry(spark_id.to_owned())
                            .or_default()
                            .push(SparkTraceStep {
                                spark_id: spark_id.to_owned(),
                                node_id: current.current_node_id.clone(),
                                event: "completed".to_owned(),
                                edge_id: None,
                                reason: Some("node completed without outputs".to_owned()),
                            });
                        state.sparks.insert(spark.id.clone(), spark);
                        self.persist_state(&state)?;
                        AdvanceOutcome::Finished
                    } else {
                        spark.status = SparkStatus::Completed;
                        state.run_history.push(RunHistoryEntry {
                            spark_id: spark_id.to_owned(),
                            graph_id: graph.id.clone(),
                            final_status: SparkStatus::Completed,
                            last_node_id: current.current_node_id.clone(),
                            reason: Some("no matching outgoing route".to_owned()),
                        });
                        events.push(RuntimeEvent::NodeStatusChanged {
                            node_id: current.current_node_id.clone(),
                            status: NodeStatus::Done,
                        });
                        state
                            .traces
                            .entry(spark_id.to_owned())
                            .or_default()
                            .push(SparkTraceStep {
                                spark_id: spark_id.to_owned(),
                                node_id: current.current_node_id.clone(),
                                event: "completed".to_owned(),
                                edge_id: None,
                                reason: Some("no matching outgoing route".to_owned()),
                            });
                        state.sparks.insert(spark.id.clone(), spark);
                        self.persist_state(&state)?;
                        AdvanceOutcome::Finished
                    }
                }
                NodeExecutionStatus::Wait => {
                    spark.status = SparkStatus::Blocked;
                    let wait_reason = result
                        .wait
                        .as_ref()
                        .and_then(|wait| wait.reason.clone())
                        .unwrap_or_else(|| "node is waiting".to_owned());
                    state.run_history.push(RunHistoryEntry {
                        spark_id: spark_id.to_owned(),
                        graph_id: graph.id.clone(),
                        final_status: SparkStatus::Blocked,
                        last_node_id: current.current_node_id.clone(),
                        reason: Some(wait_reason.clone()),
                    });
                    events.push(RuntimeEvent::NodeStatusChanged {
                        node_id: current.current_node_id.clone(),
                        status: NodeStatus::Waiting,
                    });
                    events.push(RuntimeEvent::SparkBlocked {
                        spark_id: spark_id.to_owned(),
                        reason: wait_reason.clone(),
                    });
                    events.push(RuntimeEvent::SparkWaiting {
                        spark_id: spark_id.to_owned(),
                        node_id: current.current_node_id.clone(),
                        reason: wait_reason.clone(),
                        resolution: if node.kind == "std/manual-accept" {
                            "manual-resolution".to_owned()
                        } else if node.kind == "std/accumulation" {
                            "queue-release".to_owned()
                        } else {
                            "timer".to_owned()
                        },
                    });
                    if node.kind == "std/manual-accept" {
                        events.push(RuntimeEvent::ManualGateChanged {
                            spark_id: spark_id.to_owned(),
                            node_id: current.current_node_id.clone(),
                            resolved: false,
                        });
                    }
                    if node.kind == "std/accumulation" {
                        events.push(RuntimeEvent::QueueChanged {
                            node_id: current.current_node_id.clone(),
                            released: false,
                        });
                    }
                    state
                        .traces
                        .entry(spark_id.to_owned())
                        .or_default()
                        .push(SparkTraceStep {
                            spark_id: spark_id.to_owned(),
                            node_id: current.current_node_id.clone(),
                            event: "waiting".to_owned(),
                            edge_id: None,
                            reason: Some(wait_reason),
                        });
                    state.sparks.insert(spark.id.clone(), spark);
                    self.persist_state(&state)?;
                    AdvanceOutcome::Finished
                }
                NodeExecutionStatus::Blocked => {
                    spark.status = SparkStatus::Blocked;
                    let block_reason = result
                        .diagnostics
                        .first()
                        .cloned()
                        .unwrap_or_else(|| "node execution blocked".to_owned());
                    state.run_history.push(RunHistoryEntry {
                        spark_id: spark_id.to_owned(),
                        graph_id: graph.id.clone(),
                        final_status: SparkStatus::Blocked,
                        last_node_id: current.current_node_id.clone(),
                        reason: Some(block_reason.clone()),
                    });
                    events.push(RuntimeEvent::NodeStatusChanged {
                        node_id: current.current_node_id.clone(),
                        status: NodeStatus::Blocked,
                    });
                    events.push(RuntimeEvent::SparkBlocked {
                        spark_id: spark_id.to_owned(),
                        reason: block_reason.clone(),
                    });
                    events.push(RuntimeEvent::SparkFailed {
                        spark_id: spark_id.to_owned(),
                        node_id: current.current_node_id.clone(),
                        reason: block_reason.clone(),
                    });
                    state
                        .traces
                        .entry(spark_id.to_owned())
                        .or_default()
                        .push(SparkTraceStep {
                            spark_id: spark_id.to_owned(),
                            node_id: current.current_node_id.clone(),
                            event: "blocked".to_owned(),
                            edge_id: None,
                            reason: Some(block_reason),
                        });
                    state.sparks.insert(spark.id.clone(), spark);
                    self.persist_state(&state)?;
                    AdvanceOutcome::Finished
                }
                NodeExecutionStatus::Failed => {
                    spark.status = SparkStatus::Blocked;
                    let failure_reason = result
                        .diagnostics
                        .first()
                        .cloned()
                        .unwrap_or_else(|| "node execution failed".to_owned());
                    state.run_history.push(RunHistoryEntry {
                        spark_id: spark_id.to_owned(),
                        graph_id: graph.id.clone(),
                        final_status: SparkStatus::Blocked,
                        last_node_id: current.current_node_id.clone(),
                        reason: Some(failure_reason.clone()),
                    });
                    events.push(RuntimeEvent::NodeStatusChanged {
                        node_id: current.current_node_id.clone(),
                        status: NodeStatus::Failed,
                    });
                    events.push(RuntimeEvent::SparkBlocked {
                        spark_id: spark_id.to_owned(),
                        reason: failure_reason.clone(),
                    });
                    events.push(RuntimeEvent::SparkFailed {
                        spark_id: spark_id.to_owned(),
                        node_id: current.current_node_id.clone(),
                        reason: failure_reason.clone(),
                    });
                    state
                        .traces
                        .entry(spark_id.to_owned())
                        .or_default()
                        .push(SparkTraceStep {
                            spark_id: spark_id.to_owned(),
                            node_id: current.current_node_id.clone(),
                            event: "failed".to_owned(),
                            edge_id: None,
                            reason: Some(failure_reason),
                        });
                    state.sparks.insert(spark.id.clone(), spark);
                    self.persist_state(&state)?;
                    AdvanceOutcome::Finished
                }
                NodeExecutionStatus::Complete => {
                    spark.status = SparkStatus::Completed;
                    state.run_history.push(RunHistoryEntry {
                        spark_id: spark_id.to_owned(),
                        graph_id: graph.id.clone(),
                        final_status: SparkStatus::Completed,
                        last_node_id: current.current_node_id.clone(),
                        reason: Some("node requested completion".to_owned()),
                    });
                    events.push(RuntimeEvent::NodeStatusChanged {
                        node_id: current.current_node_id.clone(),
                        status: NodeStatus::Done,
                    });
                    events.push(RuntimeEvent::SparkCompleted {
                        spark_id: spark_id.to_owned(),
                        node_id: current.current_node_id.clone(),
                        reason: "node requested completion".to_owned(),
                    });
                    state
                        .traces
                        .entry(spark_id.to_owned())
                        .or_default()
                        .push(SparkTraceStep {
                            spark_id: spark_id.to_owned(),
                            node_id: current.current_node_id.clone(),
                            event: "completed".to_owned(),
                            edge_id: None,
                            reason: Some("node requested completion".to_owned()),
                        });
                    state.sparks.insert(spark.id.clone(), spark);
                    self.persist_state(&state)?;
                    AdvanceOutcome::Finished
                }
            }
        };
        self.emit_many(events);
        Ok(outcome)
    }

    fn persist_state(&self, state: &RuntimeState) -> Result<(), RuntimeError> {
        let snapshot = RuntimeSnapshot {
            graph: state.graph.clone(),
            active_sparks: state.sparks.values().cloned().collect(),
            run_history: state.run_history.clone(),
            diagnostics: state.diagnostics.clone(),
            traces: state
                .traces
                .values()
                .flat_map(|steps| steps.iter().cloned())
                .collect(),
            cache_entries: state.cache_store.clone().into_iter().collect(),
            freezer_entries: state.freezer_store.clone().into_iter().collect(),
        };
        self.store
            .write_snapshot(&snapshot)
            .map_err(|error| RuntimeError::InvalidGraph(error.to_string()))
    }

    fn emit(&self, event: RuntimeEvent) {
        let _ = self.tx.send(event);
    }

    fn emit_many(&self, events: Vec<RuntimeEvent>) {
        for event in events {
            self.emit(event);
        }
    }
}

enum AdvanceOutcome {
    Continue,
    Finished,
}

fn workspace_nodes_dir() -> std::path::PathBuf {
    std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("core should live in workspace root")
        .join("nodes")
}

fn workspace_root_dir() -> std::path::PathBuf {
    std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("core should live in workspace root")
        .to_path_buf()
}

fn workspace_runtime_dir() -> std::path::PathBuf {
    workspace_root_dir().join(".orchidex").join("runtime")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{GraphEdge, GraphNode, GraphPosition};
    fn test_runtime(graph: Graph) -> RuntimeHandle {
        RuntimeHandle::ephemeral(graph)
    }

    #[tokio::test]
    async fn allows_many_concurrent_sparks_and_extinguishes_them() {
        let runtime = test_runtime(default_graph());
        let first = runtime
            .ignite(IgniteSparkRequest {
                node_id: "manual-start".to_owned(),
                payload: serde_json::json!({ "item": 1 }),
            })
            .expect("first spark should ignite");
        let second = runtime
            .ignite(IgniteSparkRequest {
                node_id: "manual-start".to_owned(),
                payload: serde_json::json!({ "item": 2 }),
            })
            .expect("second spark should ignite");

        assert_ne!(first.id, second.id);
        assert_eq!(runtime.extinguish_all().expect("extinguish should work"), 2);
    }

    #[tokio::test]
    async fn marks_spark_blocked_when_live_edit_removes_current_node() {
        let runtime = test_runtime(Graph {
            id: "test".to_owned(),
            name: "Test".to_owned(),
            nodes: vec![GraphNode {
                id: "a".to_owned(),
                kind: "debug/placeholder-echo".to_owned(),
                label: "A".to_owned(),
                position: GraphPosition { x: 0.0, y: 0.0 },
                config: serde_json::json!({}),
            }],
            edges: vec![GraphEdge {
                id: "loop".to_owned(),
                source: "a".to_owned(),
                source_port: "out".to_owned(),
                target: "a".to_owned(),
                target_port: "in".to_owned(),
                label: None,
            }],
        });
        let mut rx = runtime.subscribe();
        let spark = runtime
            .ignite(IgniteSparkRequest {
                node_id: "a".to_owned(),
                payload: serde_json::json!({}),
            })
            .expect("spark should ignite");

        runtime
            .replace_graph(Graph {
                id: "test".to_owned(),
                name: "Test".to_owned(),
                nodes: vec![],
                edges: vec![],
            })
            .expect("graph replacement should work");

        let mut saw_blocked = false;
        for _ in 0..5 {
            if let Ok(RuntimeEvent::SparkBlocked { spark_id, .. }) = rx.try_recv() {
                saw_blocked = spark_id == spark.id;
                break;
            }
        }
        assert!(saw_blocked);
    }

    #[test]
    fn rejects_graphs_with_unknown_ports() {
        let runtime = test_runtime(default_graph());
        let error = runtime
            .replace_graph(Graph {
                id: "test".to_owned(),
                name: "Test".to_owned(),
                nodes: vec![
                    GraphNode {
                        id: "a".to_owned(),
                        kind: "std/manual-ignite".to_owned(),
                        label: "A".to_owned(),
                        position: GraphPosition { x: 0.0, y: 0.0 },
                        config: serde_json::json!({}),
                    },
                    GraphNode {
                        id: "b".to_owned(),
                        kind: "std/transmute".to_owned(),
                        label: "B".to_owned(),
                        position: GraphPosition { x: 1.0, y: 0.0 },
                        config: serde_json::json!({}),
                    },
                ],
                edges: vec![GraphEdge {
                    id: "broken".to_owned(),
                    source: "a".to_owned(),
                    source_port: "missing".to_owned(),
                    target: "b".to_owned(),
                    target_port: "in".to_owned(),
                    label: None,
                }],
            })
            .expect_err("invalid graph should be rejected");

        assert!(error
            .to_string()
            .contains("source port 'missing' is not defined"));
    }

    #[tokio::test]
    async fn restores_run_history_and_traces_from_store() {
        let suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock should be available")
            .as_nanos();
        let store_path = std::env::temp_dir().join(format!("orchidex-runtime-restore-{suffix}"));
        let store = RuntimeStore::new(store_path.clone());
        let runtime = RuntimeHandle::with_store(default_graph(), store.clone());

        let _spark = runtime
            .ignite(IgniteSparkRequest {
                node_id: "manual-start".to_owned(),
                payload: serde_json::json!({ "source": "test" }),
            })
            .expect("spark should ignite");
        tokio::time::sleep(Duration::from_millis(300)).await;

        let restored = RuntimeHandle::with_store(default_graph(), store);
        let traces = restored.traces().expect("traces should load");

        assert!(!traces.is_empty());
        let _ = std::fs::remove_dir_all(store_path);
    }

    #[tokio::test]
    async fn records_waiting_runtime_state_in_history() {
        let runtime = test_runtime(Graph {
            id: "wait-graph".to_owned(),
            name: "Wait".to_owned(),
            nodes: vec![GraphNode {
                id: "gate".to_owned(),
                kind: "std/manual-accept".to_owned(),
                label: "Gate".to_owned(),
                position: GraphPosition { x: 0.0, y: 0.0 },
                config: serde_json::json!({ "prompt": "Approve?" }),
            }],
            edges: vec![],
        });

        let spark = runtime
            .ignite(IgniteSparkRequest {
                node_id: "gate".to_owned(),
                payload: serde_json::json!({ "ticket": 7 }),
            })
            .expect("spark should ignite");
        tokio::time::sleep(Duration::from_millis(300)).await;

        let history = runtime.run_history().expect("history should load");
        assert!(history
            .iter()
            .any(|entry| entry.spark_id == spark.id && entry.reason.as_deref() == Some("manual acceptance required")));
    }

    #[tokio::test]
    async fn records_failed_runtime_state_in_history() {
        let runtime = test_runtime(Graph {
            id: "fail-graph".to_owned(),
            name: "Fail".to_owned(),
            nodes: vec![GraphNode {
                id: "codex".to_owned(),
                kind: "codex/exec".to_owned(),
                label: "Codex".to_owned(),
                position: GraphPosition { x: 0.0, y: 0.0 },
                config: serde_json::json!({}),
            }],
            edges: vec![],
        });

        let spark = runtime
            .ignite(IgniteSparkRequest {
                node_id: "codex".to_owned(),
                payload: serde_json::json!({ "ticket": 7 }),
            })
            .expect("spark should ignite");
        tokio::time::sleep(Duration::from_millis(300)).await;

        let history = runtime.run_history().expect("history should load");
        assert!(history.iter().any(|entry| {
            entry.spark_id == spark.id
                && entry.reason.as_deref()
                    == Some("codex fixture path is required when recording is disabled")
        }));
    }

    #[tokio::test]
    async fn release_queue_resumes_blocked_accumulation_spark() {
        let runtime = test_runtime(Graph {
            id: "queue-graph".to_owned(),
            name: "Queue".to_owned(),
            nodes: vec![
                GraphNode {
                    id: "queue".to_owned(),
                    kind: "std/accumulation".to_owned(),
                    label: "Queue".to_owned(),
                    position: GraphPosition { x: 0.0, y: 0.0 },
                    config: serde_json::json!({ "locked": true }),
                },
                GraphNode {
                    id: "next".to_owned(),
                    kind: "debug/placeholder-echo".to_owned(),
                    label: "Next".to_owned(),
                    position: GraphPosition { x: 100.0, y: 0.0 },
                    config: serde_json::json!({}),
                },
            ],
            edges: vec![GraphEdge {
                id: "queue-next".to_owned(),
                source: "queue".to_owned(),
                source_port: "out".to_owned(),
                target: "next".to_owned(),
                target_port: "in".to_owned(),
                label: None,
            }],
        });

        let spark = runtime
            .ignite(IgniteSparkRequest {
                node_id: "queue".to_owned(),
                payload: serde_json::json!({ "ticket": 1 }),
            })
            .expect("spark should ignite");
        tokio::time::sleep(Duration::from_millis(300)).await;
        let released = runtime.release_queue("queue").expect("queue should release");
        tokio::time::sleep(Duration::from_millis(600)).await;

        let history = runtime.run_history().expect("history should load");
        assert_eq!(released, 1);
        assert!(history.iter().any(|entry| {
            entry.spark_id == spark.id
                && entry.final_status == SparkStatus::Completed
                && entry.last_node_id == "next"
        }));
    }

    #[tokio::test]
    async fn resolve_manual_gate_resumes_waiting_spark() {
        let runtime = test_runtime(Graph {
            id: "manual-graph".to_owned(),
            name: "Manual".to_owned(),
            nodes: vec![
                GraphNode {
                    id: "gate".to_owned(),
                    kind: "std/manual-accept".to_owned(),
                    label: "Gate".to_owned(),
                    position: GraphPosition { x: 0.0, y: 0.0 },
                    config: serde_json::json!({ "prompt": "Approve?" }),
                },
                GraphNode {
                    id: "next".to_owned(),
                    kind: "debug/placeholder-echo".to_owned(),
                    label: "Next".to_owned(),
                    position: GraphPosition { x: 100.0, y: 0.0 },
                    config: serde_json::json!({}),
                },
            ],
            edges: vec![GraphEdge {
                id: "gate-next".to_owned(),
                source: "gate".to_owned(),
                source_port: "out".to_owned(),
                target: "next".to_owned(),
                target_port: "in".to_owned(),
                label: None,
            }],
        });

        let spark = runtime
            .ignite(IgniteSparkRequest {
                node_id: "gate".to_owned(),
                payload: serde_json::json!({ "ticket": 1 }),
            })
            .expect("spark should ignite");
        tokio::time::sleep(Duration::from_millis(300)).await;
        let resumed = runtime
            .resolve_manual_gate(ResolveManualGateRequest {
                spark_id: spark.id.clone(),
                payload: Some(serde_json::json!({ "ticket": 1, "approved": true })),
            })
            .expect("manual gate should resolve");
        tokio::time::sleep(Duration::from_millis(600)).await;

        let history = runtime.run_history().expect("history should load");
        assert_eq!(resumed.payload["manualAccepted"], true);
        assert!(history.iter().any(|entry| {
            entry.spark_id == spark.id
                && entry.final_status == SparkStatus::Completed
                && entry.last_node_id == "next"
        }));
    }
}
