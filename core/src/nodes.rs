use crate::models::{
    default_source_port, default_target_port, Graph, GraphValidationDiagnostic,
    NodeCatalogDiagnostic, NodeCatalogEntry, NodeCatalogResponse, NodePortDefinition,
    PortCardinality, PortDirection,
};
use anyhow::Context;
use rhai::{Dynamic, Engine, Map, Scope};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::{BTreeMap, HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use thiserror::Error;

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NodeManifest {
    pub id: String,
    pub label: String,
    pub description: String,
    pub entrypoint: String,
    #[serde(default)]
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

#[derive(Debug, Error)]
pub enum NodeRegistryError {
    #[error("failed to read node file '{path}': {source}")]
    Read {
        path: PathBuf,
        source: std::io::Error,
    },
}

#[derive(Clone, Debug)]
struct ManifestRecord {
    manifest: NodeManifest,
    entrypoint_path: PathBuf,
}

#[derive(Clone, Debug, Default)]
pub struct NodeRegistry {
    manifests: BTreeMap<String, ManifestRecord>,
    diagnostics: Vec<NodeCatalogDiagnostic>,
}

impl NodeRegistry {
    pub fn load_from(root: impl AsRef<Path>) -> Result<Self, NodeRegistryError> {
        let root = root.as_ref();
        let mut registry = Self::default();
        if !root.exists() {
            return Ok(registry);
        }
        registry.walk(root, root)?;
        registry
            .diagnostics
            .sort_by(|left, right| left.path.cmp(&right.path));
        Ok(registry)
    }

    pub fn catalog(&self) -> Vec<NodeCatalogEntry> {
        self.manifests
            .values()
            .map(|record| manifest_to_catalog_entry(&record.manifest))
            .collect()
    }

    pub fn diagnostics(&self) -> &[NodeCatalogDiagnostic] {
        &self.diagnostics
    }

    pub fn response(&self) -> NodeCatalogResponse {
        let mut entries = self.catalog();
        entries.sort_by(|left, right| left.id.cmp(&right.id));
        NodeCatalogResponse {
            entries,
            diagnostics: self.diagnostics.clone(),
        }
    }

    pub fn get(&self, id: &str) -> Option<&NodeManifest> {
        self.manifests.get(id).map(|record| &record.manifest)
    }

    pub fn entrypoint_path(&self, id: &str) -> Option<&Path> {
        self.manifests.get(id).map(|record| record.entrypoint_path.as_path())
    }

    pub fn validate_graph_edges(&self, graph: &Graph) -> Vec<GraphValidationDiagnostic> {
        let node_lookup: HashMap<_, _> = graph.nodes.iter().map(|node| (&node.id, node)).collect();
        let mut diagnostics = Vec::new();
        let mut outgoing_counts: HashMap<(String, String), usize> = HashMap::new();
        let mut incoming_counts: HashMap<(String, String), usize> = HashMap::new();

        for edge in &graph.edges {
            let Some(source_node) = node_lookup.get(&edge.source) else {
                diagnostics.push(GraphValidationDiagnostic {
                    edge_id: edge.id.clone(),
                    message: format!("source node '{}' does not exist", edge.source),
                    source_node_id: Some(edge.source.clone()),
                    target_node_id: Some(edge.target.clone()),
                });
                continue;
            };
            let Some(target_node) = node_lookup.get(&edge.target) else {
                diagnostics.push(GraphValidationDiagnostic {
                    edge_id: edge.id.clone(),
                    message: format!("target node '{}' does not exist", edge.target),
                    source_node_id: Some(edge.source.clone()),
                    target_node_id: Some(edge.target.clone()),
                });
                continue;
            };

            let Some(source_manifest) = self.get(&source_node.kind) else {
                diagnostics.push(GraphValidationDiagnostic {
                    edge_id: edge.id.clone(),
                    message: format!("source node kind '{}' is not registered", source_node.kind),
                    source_node_id: Some(source_node.id.clone()),
                    target_node_id: Some(target_node.id.clone()),
                });
                continue;
            };
            let Some(target_manifest) = self.get(&target_node.kind) else {
                diagnostics.push(GraphValidationDiagnostic {
                    edge_id: edge.id.clone(),
                    message: format!("target node kind '{}' is not registered", target_node.kind),
                    source_node_id: Some(source_node.id.clone()),
                    target_node_id: Some(target_node.id.clone()),
                });
                continue;
            };

            if source_manifest
                .output_ports
                .iter()
                .all(|port| port.id != edge.source_port)
            {
                diagnostics.push(GraphValidationDiagnostic {
                    edge_id: edge.id.clone(),
                    message: format!(
                        "source port '{}' is not defined for node kind '{}'",
                        edge.source_port, source_manifest.id
                    ),
                    source_node_id: Some(source_node.id.clone()),
                    target_node_id: Some(target_node.id.clone()),
                });
            }

            if target_manifest
                .input_ports
                .iter()
                .all(|port| port.id != edge.target_port)
            {
                diagnostics.push(GraphValidationDiagnostic {
                    edge_id: edge.id.clone(),
                    message: format!(
                        "target port '{}' is not defined for node kind '{}'",
                        edge.target_port, target_manifest.id
                    ),
                    source_node_id: Some(source_node.id.clone()),
                    target_node_id: Some(target_node.id.clone()),
                });
            }

            *outgoing_counts
                .entry((source_node.id.clone(), edge.source_port.clone()))
                .or_default() += 1;
            *incoming_counts
                .entry((target_node.id.clone(), edge.target_port.clone()))
                .or_default() += 1;
        }

        for node in &graph.nodes {
            let Some(manifest) = self.get(&node.kind) else {
                continue;
            };

            for port in &manifest.output_ports {
                let count = outgoing_counts
                    .get(&(node.id.clone(), port.id.clone()))
                    .copied()
                    .unwrap_or_default();
                if port.cardinality == PortCardinality::One && count > 1 {
                    diagnostics.push(GraphValidationDiagnostic {
                        edge_id: node.id.clone(),
                        message: format!(
                            "output port '{}' on node '{}' allows only one connection",
                            port.id, node.id
                        ),
                        source_node_id: Some(node.id.clone()),
                        target_node_id: None,
                    });
                }
            }

            for port in &manifest.input_ports {
                let count = incoming_counts
                    .get(&(node.id.clone(), port.id.clone()))
                    .copied()
                    .unwrap_or_default();
                if port.cardinality == PortCardinality::One && count > 1 {
                    diagnostics.push(GraphValidationDiagnostic {
                        edge_id: node.id.clone(),
                        message: format!(
                            "input port '{}' on node '{}' allows only one connection",
                            port.id, node.id
                        ),
                        source_node_id: None,
                        target_node_id: Some(node.id.clone()),
                    });
                }
            }
        }

        diagnostics
    }

    fn walk(&mut self, root: &Path, dir: &Path) -> Result<(), NodeRegistryError> {
        let manifest_path = dir.join("node.toml");
        if manifest_path.exists() {
            match fs::read_to_string(&manifest_path) {
                Ok(content) => match toml::from_str::<NodeManifest>(&content) {
                    Ok(manifest) => {
                        if let Some(record) =
                            self.validate_manifest(root, dir, manifest_path.clone(), manifest)
                        {
                            self.manifests
                                .insert(record.manifest.id.clone(), record);
                        }
                    }
                    Err(source) => self.diagnostics.push(NodeCatalogDiagnostic {
                        path: manifest_path.display().to_string(),
                        message: source.to_string(),
                        node_id: None,
                    }),
                },
                Err(source) => self.diagnostics.push(NodeCatalogDiagnostic {
                    path: manifest_path.display().to_string(),
                    message: source.to_string(),
                    node_id: None,
                }),
            }
        }

        for entry in fs::read_dir(dir).map_err(|source| NodeRegistryError::Read {
            path: dir.to_owned(),
            source,
        })? {
            let entry = entry.map_err(|source| NodeRegistryError::Read {
                path: dir.to_owned(),
                source,
            })?;
            if entry
                .file_type()
                .map(|file_type| file_type.is_dir())
                .unwrap_or(false)
            {
                self.walk(root, &entry.path())?;
            }
        }
        Ok(())
    }

    fn validate_manifest(
        &mut self,
        root: &Path,
        dir: &Path,
        manifest_path: PathBuf,
        mut manifest: NodeManifest,
    ) -> Option<ManifestRecord> {
        let expected_id = expected_manifest_id(root, dir);
        let entrypoint_path = dir.join(&manifest.entrypoint);
        let mut messages = Vec::new();

        if manifest.id != expected_id {
            messages.push(format!(
                "node id '{}' does not match folder namespace '{}'",
                manifest.id, expected_id
            ));
        }

        if manifest.input_ports.is_empty() {
            manifest.input_ports = vec![default_input_port_definition()];
        }
        if manifest.output_ports.is_empty() {
            manifest.output_ports = vec![default_output_port_definition()];
        }

        validate_ports(&manifest.input_ports, PortDirection::Input, "input", &mut messages);
        validate_ports(
            &manifest.output_ports,
            PortDirection::Output,
            "output",
            &mut messages,
        );

        if !entrypoint_path.exists() {
            messages.push(format!(
                "entrypoint '{}' does not exist",
                entrypoint_path.display()
            ));
        }

        if self.manifests.contains_key(&manifest.id) {
            messages.push(format!("duplicate node id '{}'", manifest.id));
        }

        if !messages.is_empty() {
            self.diagnostics.push(NodeCatalogDiagnostic {
                path: manifest_path.display().to_string(),
                message: messages.join("; "),
                node_id: Some(manifest.id),
            });
            return None;
        }

        Some(ManifestRecord {
            manifest,
            entrypoint_path,
        })
    }
}

pub fn discover_node_catalog(root: impl AsRef<Path>) -> NodeCatalogResponse {
    match NodeRegistry::load_from(root) {
        Ok(registry) => registry.response(),
        Err(error) => NodeCatalogResponse {
            entries: Vec::new(),
            diagnostics: vec![NodeCatalogDiagnostic {
                path: String::new(),
                message: error.to_string(),
                node_id: None,
            }],
        },
    }
}

pub fn execute_rhai_entrypoint(script: &str, payload: Value) -> anyhow::Result<Value> {
    let mut engine = Engine::new();
    engine.register_fn("log", |message: &str| {
        println!("{message}");
    });
    engine.register_fn("shell", |command: &str| -> String {
        format!("shell delegation requested: {command}")
    });
    engine.register_fn("cache_get", |_key: &str| -> Dynamic { Dynamic::UNIT });
    engine.register_fn("cache_set", |_key: &str, value: Dynamic| -> Dynamic {
        value
    });
    engine.register_fn("freeze", |_key: &str, value: Dynamic| -> Dynamic { value });
    engine.register_fn(
        "schedule_after_ms",
        |_delay_ms: i64, value: Dynamic| -> Dynamic { value },
    );

    let mut scope = Scope::new();
    scope.push_dynamic("payload", serde_json_to_dynamic(payload));
    let output = engine
        .eval_with_scope::<Dynamic>(&mut scope, script)
        .map_err(|error| anyhow::anyhow!(error.to_string()))?;
    Ok(dynamic_to_json(output))
}

pub fn execute_rhai_file(path: &Path, payload: Value) -> anyhow::Result<Value> {
    let script = fs::read_to_string(path)
        .with_context(|| format!("failed to read Rhai entrypoint '{}'", path.display()))?;
    execute_rhai_entrypoint(&script, payload)
}

fn manifest_to_catalog_entry(manifest: &NodeManifest) -> NodeCatalogEntry {
    NodeCatalogEntry {
        id: manifest.id.clone(),
        label: manifest.label.clone(),
        description: manifest.description.clone(),
        capabilities: manifest.capabilities.clone(),
        config_schema: manifest.config_schema.clone(),
        input_schema: manifest.input_schema.clone(),
        output_schema: manifest.output_schema.clone(),
        input_ports: manifest.input_ports.clone(),
        output_ports: manifest.output_ports.clone(),
    }
}

fn validate_ports(
    ports: &[NodePortDefinition],
    expected_direction: PortDirection,
    label: &str,
    messages: &mut Vec<String>,
) {
    let mut seen_ids = HashSet::new();
    for port in ports {
        if port.id.trim().is_empty() {
            messages.push(format!("{label} port id cannot be empty"));
        }
        if port.label.trim().is_empty() {
            messages.push(format!("{label} port '{}' label cannot be empty", port.id));
        }
        if port.direction != expected_direction {
            messages.push(format!(
                "{label} port '{}' must use direction '{:?}'",
                port.id, expected_direction
            ));
        }
        if !seen_ids.insert(port.id.clone()) {
            messages.push(format!("duplicate {label} port id '{}'", port.id));
        }
    }
}

fn expected_manifest_id(root: &Path, dir: &Path) -> String {
    let relative = dir.strip_prefix(root).unwrap_or(dir);
    relative
        .components()
        .map(|component| component.as_os_str().to_string_lossy().to_string())
        .collect::<Vec<_>>()
        .join("/")
}

fn default_input_port_definition() -> NodePortDefinition {
    NodePortDefinition {
        id: default_target_port(),
        label: "Input".to_owned(),
        direction: PortDirection::Input,
        schema_hints: BTreeMap::new(),
        cardinality: PortCardinality::One,
    }
}

fn default_output_port_definition() -> NodePortDefinition {
    NodePortDefinition {
        id: default_source_port(),
        label: "Output".to_owned(),
        direction: PortDirection::Output,
        schema_hints: BTreeMap::new(),
        cardinality: PortCardinality::Many,
    }
}

fn serde_json_to_dynamic(value: Value) -> Dynamic {
    match value {
        Value::Null => Dynamic::UNIT,
        Value::Bool(value) => Dynamic::from_bool(value),
        Value::Number(number) => {
            if let Some(value) = number.as_i64() {
                Dynamic::from_int(value)
            } else if let Some(value) = number.as_f64() {
                Dynamic::from_float(value)
            } else {
                Dynamic::UNIT
            }
        }
        Value::String(value) => Dynamic::from(value),
        Value::Array(values) => values
            .into_iter()
            .map(serde_json_to_dynamic)
            .collect::<rhai::Array>()
            .into(),
        Value::Object(values) => {
            let mut map = Map::new();
            for (key, value) in values {
                map.insert(key.into(), serde_json_to_dynamic(value));
            }
            map.into()
        }
    }
}

fn dynamic_to_json(value: Dynamic) -> Value {
    if value.is_unit() {
        Value::Null
    } else if let Some(value) = value.clone().try_cast::<bool>() {
        Value::Bool(value)
    } else if let Some(value) = value.clone().try_cast::<i64>() {
        Value::Number(value.into())
    } else if let Some(value) = value.clone().try_cast::<f64>() {
        serde_json::Number::from_f64(value)
            .map(Value::Number)
            .unwrap_or(Value::Null)
    } else if let Some(value) = value.clone().try_cast::<String>() {
        Value::String(value)
    } else if let Some(values) = value.clone().try_cast::<rhai::Array>() {
        Value::Array(values.into_iter().map(dynamic_to_json).collect())
    } else if let Some(values) = value.try_cast::<Map>() {
        let values = values
            .into_iter()
            .map(|(key, value)| (key.to_string(), dynamic_to_json(value)))
            .collect();
        Value::Object(values)
    } else {
        Value::Null
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{Graph, GraphEdge, GraphNode, GraphPosition};

    #[test]
    fn executes_basic_rhai_payload_transform() {
        let output =
            execute_rhai_entrypoint("payload[\"answer\"] = 42; payload", serde_json::json!({}))
                .expect("script should execute");
        assert_eq!(output["answer"], 42);
    }

    #[test]
    fn discovers_catalog_entries_without_diagnostics_for_valid_nodes() {
        let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .expect("core should live in workspace root")
            .join("nodes");
        let catalog = discover_node_catalog(root);

        assert!(catalog
            .entries
            .iter()
            .any(|node| node.id == "std/manual-ignite"));
        assert!(catalog.diagnostics.is_empty());
    }

    #[test]
    fn assigns_default_ports_to_legacy_nodes() {
        let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .expect("core should live in workspace root")
            .join("nodes");
        let registry = NodeRegistry::load_from(root).expect("node registry should load");
        let manifest = registry
            .get("std/manual-ignite")
            .expect("manual ignite manifest should load");

        assert_eq!(manifest.input_ports[0].id, "in");
        assert_eq!(manifest.output_ports[0].id, "out");
    }

    #[test]
    fn reports_missing_ports_and_cardinality_violations() {
        let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .expect("core should live in workspace root")
            .join("nodes");
        let registry = NodeRegistry::load_from(root).expect("node registry should load");
        let graph = Graph {
            id: "graph".to_owned(),
            name: "Graph".to_owned(),
            nodes: vec![
                GraphNode {
                    id: "source".to_owned(),
                    kind: "std/manual-ignite".to_owned(),
                    label: "Source".to_owned(),
                    position: GraphPosition { x: 0.0, y: 0.0 },
                    config: serde_json::json!({}),
                },
                GraphNode {
                    id: "left".to_owned(),
                    kind: "std/transmute".to_owned(),
                    label: "Left".to_owned(),
                    position: GraphPosition { x: 100.0, y: 0.0 },
                    config: serde_json::json!({}),
                },
                GraphNode {
                    id: "right".to_owned(),
                    kind: "std/transmute".to_owned(),
                    label: "Right".to_owned(),
                    position: GraphPosition { x: 200.0, y: 0.0 },
                    config: serde_json::json!({}),
                },
                GraphNode {
                    id: "source-2".to_owned(),
                    kind: "std/manual-ignite".to_owned(),
                    label: "Source 2".to_owned(),
                    position: GraphPosition { x: 0.0, y: 100.0 },
                    config: serde_json::json!({}),
                },
            ],
            edges: vec![
                GraphEdge {
                    id: "edge-a".to_owned(),
                    source: "source".to_owned(),
                    source_port: "out".to_owned(),
                    target: "left".to_owned(),
                    target_port: "in".to_owned(),
                    label: None,
                },
                GraphEdge {
                    id: "edge-b".to_owned(),
                    source: "source".to_owned(),
                    source_port: "out".to_owned(),
                    target: "left".to_owned(),
                    target_port: "in".to_owned(),
                    label: None,
                },
                GraphEdge {
                    id: "edge-c".to_owned(),
                    source: "source-2".to_owned(),
                    source_port: "out".to_owned(),
                    target: "right".to_owned(),
                    target_port: "missing".to_owned(),
                    label: None,
                },
            ],
        };

        let diagnostics = registry.validate_graph_edges(&graph);

        assert!(diagnostics.iter().any(|diagnostic| diagnostic
            .message
            .contains("target port 'missing' is not defined")));
        assert!(diagnostics.iter().any(|diagnostic| diagnostic
            .message
            .contains("input port 'in' on node 'left' allows only one connection")));
    }
}
