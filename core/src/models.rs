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
    pub target: String,
    #[serde(default)]
    pub label: Option<String>,
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

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IgniteSparkRequest {
    pub node_id: String,
    #[serde(default)]
    pub payload: Payload,
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
    SparkExtinguished {
        spark_id: String,
    },
    AllSparksExtinguished,
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
                config: serde_json::json!({ "model": "5.3-Codex-Spark", "effort": "medium" }),
            },
            GraphNode {
                id: "codex-plan".to_owned(),
                kind: "codex/exec".to_owned(),
                label: "Split tasks".to_owned(),
                position: GraphPosition {
                    x: 1200.0,
                    y: 120.0,
                },
                config: serde_json::json!({ "model": "5.3", "effort": "high" }),
            },
        ],
        edges: vec![
            GraphEdge {
                id: "manual-to-queue".to_owned(),
                source: "manual-start".to_owned(),
                target: "mail-accumulation".to_owned(),
                label: Some("release".to_owned()),
            },
            GraphEdge {
                id: "queue-to-extract".to_owned(),
                source: "mail-accumulation".to_owned(),
                target: "extract-work".to_owned(),
                label: Some("one by one".to_owned()),
            },
            GraphEdge {
                id: "extract-to-branch".to_owned(),
                source: "extract-work".to_owned(),
                target: "codex-branch".to_owned(),
                label: Some("task payload".to_owned()),
            },
            GraphEdge {
                id: "branch-to-plan".to_owned(),
                source: "codex-branch".to_owned(),
                target: "codex-plan".to_owned(),
                label: Some("ready branch".to_owned()),
            },
        ],
    }
}
