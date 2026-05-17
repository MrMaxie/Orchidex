use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeMap;

pub type Payload = Value;

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Graph {
    pub id: String,
    pub name: String,
    pub nodes: Vec<GraphNode>,
    pub edges: Vec<GraphEdge>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GraphNode {
    pub id: String,
    pub kind: String,
    pub label: String,
    pub position: GraphPosition,
    #[serde(default)]
    pub config: Value,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GraphPosition {
    pub x: f64,
    pub y: f64,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GraphEdge {
    pub id: String,
    pub source: String,
    #[serde(default = "default_source_port")]
    pub source_port: String,
    pub target: String,
    #[serde(default = "default_target_port")]
    pub target_port: String,
    #[serde(default)]
    pub label: Option<String>,
}

pub fn default_source_port() -> String {
    "out".to_owned()
}

pub fn default_target_port() -> String {
    "in".to_owned()
}

#[derive(Clone, Debug, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum PortDirection {
    Input,
    Output,
}

#[derive(Clone, Debug, Deserialize, Serialize, Eq, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub enum PortCardinality {
    #[default]
    One,
    Many,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct NodePortDefinition {
    pub id: String,
    pub label: String,
    pub direction: PortDirection,
    #[serde(default)]
    pub schema_hints: BTreeMap<String, Value>,
    #[serde(default)]
    pub cardinality: PortCardinality,
}

#[derive(Clone, Debug, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum NodeStatus {
    Idle,
    Queued,
    Running,
    Waiting,
    Done,
    Failed,
    Blocked,
}

#[derive(Clone, Debug, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum SparkStatus {
    Active,
    Blocked,
    Completed,
    Extinguished,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Spark {
    pub id: String,
    pub current_node_id: String,
    pub payload: Payload,
    pub status: SparkStatus,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SparkTraceStep {
    pub spark_id: String,
    pub node_id: String,
    pub event: String,
    #[serde(default)]
    pub edge_id: Option<String>,
    #[serde(default)]
    pub reason: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeDiagnostic {
    pub kind: String,
    pub message: String,
    pub graph_id: String,
    #[serde(default)]
    pub spark_id: Option<String>,
    #[serde(default)]
    pub node_id: Option<String>,
    #[serde(default)]
    pub context: BTreeMap<String, Value>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RunHistoryEntry {
    pub spark_id: String,
    pub graph_id: String,
    pub final_status: SparkStatus,
    pub last_node_id: String,
    #[serde(default)]
    pub reason: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeSnapshot {
    pub graph: Graph,
    pub active_sparks: Vec<Spark>,
    pub run_history: Vec<RunHistoryEntry>,
    pub diagnostics: Vec<RuntimeDiagnostic>,
    pub traces: Vec<SparkTraceStep>,
    pub cache_entries: BTreeMap<String, Value>,
    pub freezer_entries: BTreeMap<String, Value>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IgniteSparkRequest {
    pub node_id: String,
    #[serde(default)]
    pub payload: Payload,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolveManualGateRequest {
    pub spark_id: String,
    #[serde(default)]
    pub payload: Option<Payload>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandResult<T> {
    pub ok: bool,
    pub value: Option<T>,
    pub error: Option<String>,
}

impl<T> CommandResult<T> {
    pub fn ok(value: T) -> Self {
        Self {
            ok: true,
            value: Some(value),
            error: None,
        }
    }

    pub fn error(error: impl Into<String>) -> Self {
        Self {
            ok: false,
            value: None,
            error: Some(error.into()),
        }
    }
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum RuntimeEvent {
    GraphUpdated {
        graph: Graph,
    },
    SparkIgnited {
        spark: Spark,
    },
    SparkMoved {
        spark_id: String,
        from_node_id: String,
        to_node_id: String,
        edge_id: String,
    },
    NodeStatusChanged {
        node_id: String,
        status: NodeStatus,
    },
    SparkBlocked {
        spark_id: String,
        reason: String,
    },
    SparkWaiting {
        spark_id: String,
        node_id: String,
        reason: String,
        resolution: String,
    },
    SparkFailed {
        spark_id: String,
        node_id: String,
        reason: String,
    },
    SparkCompleted {
        spark_id: String,
        node_id: String,
        reason: String,
    },
    SparkExtinguished {
        spark_id: String,
    },
    AllSparksExtinguished,
    QueueChanged {
        node_id: String,
        released: bool,
    },
    ManualGateChanged {
        spark_id: String,
        node_id: String,
        resolved: bool,
    },
    DiagnosticRecorded {
        diagnostic: RuntimeDiagnostic,
    },
    Log {
        node_id: String,
        message: String,
    },
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct NodeCatalogEntry {
    pub id: String,
    pub label: String,
    pub description: String,
    pub capabilities: Vec<String>,
    #[serde(default)]
    pub config_schema: BTreeMap<String, Value>,
    #[serde(default)]
    pub input_schema: BTreeMap<String, Value>,
    #[serde(default)]
    pub output_schema: BTreeMap<String, Value>,
    #[serde(default)]
    pub input_ports: Vec<NodePortDefinition>,
    #[serde(default)]
    pub output_ports: Vec<NodePortDefinition>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct NodeCatalogDiagnostic {
    pub path: String,
    pub message: String,
    #[serde(default)]
    pub node_id: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GraphValidationDiagnostic {
    pub edge_id: String,
    pub message: String,
    #[serde(default)]
    pub source_node_id: Option<String>,
    #[serde(default)]
    pub target_node_id: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct NodeCatalogResponse {
    pub entries: Vec<NodeCatalogEntry>,
    #[serde(default)]
    pub diagnostics: Vec<NodeCatalogDiagnostic>,
}

pub fn default_graph() -> Graph {
    Graph {
        id: "clients-project".to_owned(),
        name: "Clients project".to_owned(),
        nodes: vec![
            GraphNode {
                id: "manual-start".to_owned(),
                kind: "std/manual-ignite".to_owned(),
                label: "Manual intake".to_owned(),
                position: GraphPosition { x: 0.0, y: 120.0 },
                config: serde_json::json!({
                    "form": [
                        { "name": "source", "type": "select", "options": ["mail", "manual"] },
                        { "name": "priority", "type": "radio", "options": ["normal", "urgent"] }
                    ]
                }),
            },
            GraphNode {
                id: "mail-accumulation".to_owned(),
                kind: "std/accumulation".to_owned(),
                label: "Mail queue".to_owned(),
                position: GraphPosition { x: 300.0, y: 120.0 },
                config: serde_json::json!({ "order": "fifo", "locked": true }),
            },
            GraphNode {
                id: "extract-work".to_owned(),
                kind: "std/transmute".to_owned(),
                label: "Extract work items".to_owned(),
                position: GraphPosition { x: 600.0, y: 120.0 },
                config: serde_json::json!({ "script": "payload" }),
            },
            GraphNode {
                id: "codex-branch".to_owned(),
                kind: "codex/exec".to_owned(),
                label: "Select branch".to_owned(),
                position: GraphPosition { x: 900.0, y: 60.0 },
                config: serde_json::json!({
                    "model": "5.3-Codex-Spark",
                    "effort": "medium",
                    "fixture": "examples/fixtures/clients-project/codex-select-branch.json"
                }),
            },
            GraphNode {
                id: "codex-plan".to_owned(),
                kind: "codex/exec".to_owned(),
                label: "Split tasks".to_owned(),
                position: GraphPosition {
                    x: 1200.0,
                    y: 120.0,
                },
                config: serde_json::json!({
                    "model": "5.3",
                    "effort": "high",
                    "fixture": "examples/fixtures/clients-project/codex-split-tasks.json"
                }),
            },
        ],
        edges: vec![
            GraphEdge {
                id: "manual-to-queue".to_owned(),
                source: "manual-start".to_owned(),
                source_port: default_source_port(),
                target: "mail-accumulation".to_owned(),
                target_port: default_target_port(),
                label: Some("release".to_owned()),
            },
            GraphEdge {
                id: "queue-to-extract".to_owned(),
                source: "mail-accumulation".to_owned(),
                source_port: default_source_port(),
                target: "extract-work".to_owned(),
                target_port: default_target_port(),
                label: Some("one by one".to_owned()),
            },
            GraphEdge {
                id: "extract-to-branch".to_owned(),
                source: "extract-work".to_owned(),
                source_port: default_source_port(),
                target: "codex-branch".to_owned(),
                target_port: default_target_port(),
                label: Some("task payload".to_owned()),
            },
            GraphEdge {
                id: "branch-to-plan".to_owned(),
                source: "codex-branch".to_owned(),
                source_port: default_source_port(),
                target: "codex-plan".to_owned(),
                target_port: default_target_port(),
                label: Some("ready branch".to_owned()),
            },
        ],
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn legacy_edge_deserialization_uses_default_ports() {
        let edge: GraphEdge = serde_json::from_value(serde_json::json!({
            "id": "legacy-edge",
            "source": "a",
            "target": "b",
            "label": "legacy route"
        }))
        .expect("legacy graph edge should deserialize");

        assert_eq!(edge.source_port, "out");
        assert_eq!(edge.target_port, "in");
    }

    #[test]
    fn graph_edge_serializes_port_endpoints() {
        let edge = GraphEdge {
            id: "ported-edge".to_owned(),
            source: "a".to_owned(),
            source_port: "approved".to_owned(),
            target: "b".to_owned(),
            target_port: "intake".to_owned(),
            label: Some("route metadata".to_owned()),
        };

        let value = serde_json::to_value(edge).expect("edge should serialize");

        assert_eq!(value["sourcePort"], "approved");
        assert_eq!(value["targetPort"], "intake");
        assert_eq!(value["label"], "route metadata");
    }
}
