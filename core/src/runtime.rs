use crate::models::{
    default_graph, default_source_port, Graph, IgniteSparkRequest, NodeCatalogResponse, NodeStatus,
    RuntimeEvent, Spark, SparkStatus,
};
use crate::nodes::{
    discover_node_catalog, execute_rhai_file_with_context, NodeExecutionHost, NodeExecutionStatus,
    NodeRegistry,
};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
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
}

#[derive(Debug)]
struct RuntimeState {
    graph: Graph,
    sparks: HashMap<String, Spark>,
    cache_store: HashMap<String, serde_json::Value>,
    freezer_store: HashMap<String, serde_json::Value>,
    epoch: u64,
}

impl RuntimeHandle {
    pub fn new(graph: Graph) -> Self {
        let (tx, _) = broadcast::channel(256);
        Self {
            state: Arc::new(Mutex::new(RuntimeState {
                graph,
                sparks: HashMap::new(),
                cache_store: HashMap::new(),
                freezer_store: HashMap::new(),
                epoch: 0,
            })),
            tx,
        }
    }

    pub fn demo() -> Self {
        Self::new(default_graph())
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

    pub fn subscribe(&self) -> broadcast::Receiver<RuntimeEvent> {
        self.tx.subscribe()
    }

    pub fn node_catalog(&self) -> NodeCatalogResponse {
        discover_node_catalog(workspace_nodes_dir())
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
                if let Some(spark) = state.sparks.get_mut(spark_id) {
                    spark.status = SparkStatus::Blocked;
                }
                events.push(RuntimeEvent::SparkBlocked {
                    spark_id: spark_id.to_owned(),
                    reason: "current node is missing".to_owned(),
                });
                return Ok(AdvanceOutcome::Finished);
            };

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
            let Some(spark) = state.sparks.get_mut(spark_id) else {
                return Ok(AdvanceOutcome::Finished);
            };
            if spark.status != SparkStatus::Active {
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
                            events.push(RuntimeEvent::NodeStatusChanged {
                                node_id: current.current_node_id.clone(),
                                status: NodeStatus::Blocked,
                            });
                            events.push(RuntimeEvent::SparkBlocked {
                                spark_id: spark_id.to_owned(),
                                reason: format!("edge '{}' points to a missing node", edge.id),
                            });
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
                                edge_id: edge.id,
                            });
                            events.push(RuntimeEvent::NodeStatusChanged {
                                node_id: edge.target,
                                status: NodeStatus::Running,
                            });
                            AdvanceOutcome::Continue
                        }
                    } else if manifest.output_ports.is_empty() {
                        spark.status = SparkStatus::Completed;
                        events.push(RuntimeEvent::NodeStatusChanged {
                            node_id: current.current_node_id.clone(),
                            status: NodeStatus::Done,
                        });
                        AdvanceOutcome::Finished
                    } else {
                        spark.status = SparkStatus::Completed;
                        events.push(RuntimeEvent::NodeStatusChanged {
                            node_id: current.current_node_id.clone(),
                            status: NodeStatus::Done,
                        });
                        AdvanceOutcome::Finished
                    }
                }
                NodeExecutionStatus::Wait => {
                    spark.status = SparkStatus::Blocked;
                    events.push(RuntimeEvent::NodeStatusChanged {
                        node_id: current.current_node_id.clone(),
                        status: NodeStatus::Waiting,
                    });
                    events.push(RuntimeEvent::SparkBlocked {
                        spark_id: spark_id.to_owned(),
                        reason: result
                            .wait
                            .as_ref()
                            .and_then(|wait| wait.reason.clone())
                            .unwrap_or_else(|| "node is waiting".to_owned()),
                    });
                    AdvanceOutcome::Finished
                }
                NodeExecutionStatus::Blocked => {
                    spark.status = SparkStatus::Blocked;
                    events.push(RuntimeEvent::NodeStatusChanged {
                        node_id: current.current_node_id.clone(),
                        status: NodeStatus::Blocked,
                    });
                    events.push(RuntimeEvent::SparkBlocked {
                        spark_id: spark_id.to_owned(),
                        reason: result
                            .diagnostics
                            .first()
                            .cloned()
                            .unwrap_or_else(|| "node execution blocked".to_owned()),
                    });
                    AdvanceOutcome::Finished
                }
                NodeExecutionStatus::Failed => {
                    spark.status = SparkStatus::Blocked;
                    events.push(RuntimeEvent::NodeStatusChanged {
                        node_id: current.current_node_id.clone(),
                        status: NodeStatus::Failed,
                    });
                    events.push(RuntimeEvent::SparkBlocked {
                        spark_id: spark_id.to_owned(),
                        reason: result
                            .diagnostics
                            .first()
                            .cloned()
                            .unwrap_or_else(|| "node execution failed".to_owned()),
                    });
                    AdvanceOutcome::Finished
                }
                NodeExecutionStatus::Complete => {
                    spark.status = SparkStatus::Completed;
                    events.push(RuntimeEvent::NodeStatusChanged {
                        node_id: current.current_node_id.clone(),
                        status: NodeStatus::Done,
                    });
                    AdvanceOutcome::Finished
                }
            }
        };
        self.emit_many(events);
        Ok(outcome)
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{GraphEdge, GraphNode, GraphPosition};

    #[tokio::test]
    async fn allows_many_concurrent_sparks_and_extinguishes_them() {
        let runtime = RuntimeHandle::demo();
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
        let runtime = RuntimeHandle::new(Graph {
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
        let runtime = RuntimeHandle::demo();
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
}
