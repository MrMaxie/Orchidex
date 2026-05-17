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
use std::sync::{Arc, Mutex};
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

#[derive(Clone, Debug, Default)]
pub struct NodeExecutionHost {
    pub cache_entries: BTreeMap<String, Value>,
    pub freezer_entries: BTreeMap<String, Value>,
    pub fixture_root: PathBuf,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum NodeExecutionStatus {
    Continue,
    Wait,
    Blocked,
    Failed,
    Complete,
}

#[derive(Clone, Debug, Default, PartialEq)]
pub struct NodeWait {
    pub delay_ms: Option<u64>,
    pub reason: Option<String>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct ShellInvocation {
    pub command: String,
    pub output: String,
    pub exit_status: i64,
}

#[derive(Clone, Debug, Default, PartialEq)]
pub struct NodeExecutionResult {
    pub status: NodeExecutionStatus,
    pub payload: Value,
    pub route: Option<String>,
    pub diagnostics: Vec<String>,
    pub logs: Vec<String>,
    pub wait: Option<NodeWait>,
    pub cache_writes: BTreeMap<String, Value>,
    pub freezer_writes: BTreeMap<String, Value>,
    pub shell_invocations: Vec<ShellInvocation>,
}

impl Default for NodeExecutionStatus {
    fn default() -> Self {
        Self::Continue
    }
}

#[derive(Clone, Debug, Default)]
struct NodeExecutionJournal {
    logs: Vec<String>,
    diagnostics: Vec<String>,
    cache_writes: BTreeMap<String, Value>,
    freezer_writes: BTreeMap<String, Value>,
    shell_invocations: Vec<ShellInvocation>,
    fatal_error: Option<String>,
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
    let result = execute_rhai_entrypoint_with_context(
        script,
        payload,
        Value::Object(Default::default()),
        &NodeExecutionHost::default(),
    )?;
    Ok(result.payload)
}

pub fn execute_rhai_entrypoint_with_context(
    script: &str,
    payload: Value,
    config: Value,
    host: &NodeExecutionHost,
) -> anyhow::Result<NodeExecutionResult> {
    let mut engine = Engine::new();
    let journal = Arc::new(Mutex::new(NodeExecutionJournal::default()));
    let cache_entries = Arc::new(Mutex::new(host.cache_entries.clone()));
    let freezer_entries = Arc::new(Mutex::new(host.freezer_entries.clone()));
    let fixture_root = host.fixture_root.clone();

    {
        let journal = Arc::clone(&journal);
        engine.register_fn("log", move |message: &str| {
            if let Ok(mut journal) = journal.lock() {
                journal.logs.push(message.to_owned());
            }
            println!("{message}");
        });
    }

    {
        let journal = Arc::clone(&journal);
        engine.register_fn("shell", move |command: &str| -> String {
            let output = format!("shell delegation requested: {command}");
            if let Ok(mut journal) = journal.lock() {
                journal.shell_invocations.push(ShellInvocation {
                    command: command.to_owned(),
                    output: output.clone(),
                    exit_status: 0,
                });
                journal
                    .diagnostics
                    .push(format!("shell delegation recorded for '{command}'"));
            }
            output
        });
    }

    {
        let journal = Arc::clone(&journal);
        let cache_entries = Arc::clone(&cache_entries);
        engine.register_fn("cache_get", move |key: &str| -> Dynamic {
            let cached = cache_entries
                .lock()
                .ok()
                .and_then(|entries| entries.get(key).cloned());
            if let Ok(mut journal) = journal.lock() {
                journal.diagnostics.push(if cached.is_some() {
                    format!("cache hit for key '{key}'")
                } else {
                    format!("cache miss for key '{key}'")
                });
            }
            cached.map(serde_json_to_dynamic).unwrap_or(Dynamic::UNIT)
        });
    }

    {
        let journal = Arc::clone(&journal);
        let cache_entries = Arc::clone(&cache_entries);
        engine.register_fn("cache_set", move |key: &str, value: Dynamic| -> Dynamic {
            let json_value = dynamic_to_json(value.clone());
            if let Ok(mut entries) = cache_entries.lock() {
                entries.insert(key.to_owned(), json_value.clone());
            }
            if let Ok(mut journal) = journal.lock() {
                journal.cache_writes.insert(key.to_owned(), json_value);
            }
            value
        });
    }

    {
        let journal = Arc::clone(&journal);
        let freezer_entries = Arc::clone(&freezer_entries);
        engine.register_fn("freeze", move |key: &str, value: Dynamic| -> Dynamic {
            if let Ok(entries) = freezer_entries.lock() {
                if let Some(existing) = entries.get(key) {
                    return serde_json_to_dynamic(existing.clone());
                }
            }

            let json_value = dynamic_to_json(value.clone());
            if let Ok(mut entries) = freezer_entries.lock() {
                entries.insert(key.to_owned(), json_value.clone());
            }
            if let Ok(mut journal) = journal.lock() {
                journal.freezer_writes.insert(key.to_owned(), json_value);
                journal
                    .diagnostics
                    .push(format!("freezer miss for key '{key}', captured new output"));
            }
            value
        });
    }

    engine.register_fn(
        "schedule_after_ms",
        |delay_ms: i64, value: Dynamic| -> Dynamic {
            if delay_ms <= 0 {
                return value;
            }

            let mut wait = Map::new();
            wait.insert("delayMs".into(), Dynamic::from_int(delay_ms));
            wait.insert("reason".into(), Dynamic::from("timer"));

            let mut outcome = Map::new();
            outcome.insert("status".into(), Dynamic::from("wait"));
            outcome.insert("payload".into(), value);
            outcome.insert("wait".into(), Dynamic::from(wait));
            Dynamic::from(outcome)
        },
    );

    {
        let journal = Arc::clone(&journal);
        let fixture_root = fixture_root.clone();
        engine.register_fn("codex_fixture", move |path: &str| -> Dynamic {
            let fixture_path = resolve_fixture_path(&fixture_root, path);
            match fs::read_to_string(&fixture_path)
                .ok()
                .and_then(|content| serde_json::from_str::<Value>(&content).ok())
            {
                Some(value) => serde_json_to_dynamic(value),
                None => {
                    if let Ok(mut journal) = journal.lock() {
                        journal.fatal_error = Some(format!(
                            "fixture '{path}' is missing or invalid and recording is disabled"
                        ));
                    }
                    Dynamic::UNIT
                }
            }
        });
    }

    let mut scope = Scope::new();
    scope.push_dynamic("payload", serde_json_to_dynamic(payload));
    scope.push_dynamic("config", serde_json_to_dynamic(config));
    let output = engine
        .eval_with_scope::<Dynamic>(&mut scope, script)
        .map_err(|error| anyhow::anyhow!(error.to_string()))?;
    let journal = journal
        .lock()
        .map_err(|_| anyhow::anyhow!("node execution journal lock is poisoned"))?
        .clone();
    parse_execution_result(output, journal)
}

pub fn execute_rhai_file(path: &Path, payload: Value) -> anyhow::Result<Value> {
    let result = execute_rhai_file_with_context(
        path,
        payload,
        Value::Object(Default::default()),
        &NodeExecutionHost::default(),
    )?;
    Ok(result.payload)
}

pub fn execute_rhai_file_with_context(
    path: &Path,
    payload: Value,
    config: Value,
    host: &NodeExecutionHost,
) -> anyhow::Result<NodeExecutionResult> {
    let script = fs::read_to_string(path)
        .with_context(|| format!("failed to read Rhai entrypoint '{}'", path.display()))?;
    execute_rhai_entrypoint_with_context(&script, payload, config, host)
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

fn parse_execution_result(
    output: Dynamic,
    journal: NodeExecutionJournal,
) -> anyhow::Result<NodeExecutionResult> {
    if let Some(message) = journal.fatal_error.clone() {
        return Ok(NodeExecutionResult {
            status: NodeExecutionStatus::Failed,
            payload: Value::Null,
            diagnostics: with_message(journal.diagnostics, message),
            logs: journal.logs,
            wait: None,
            cache_writes: journal.cache_writes,
            freezer_writes: journal.freezer_writes,
            shell_invocations: journal.shell_invocations,
            route: None,
        });
    }

    let value = dynamic_to_json(output);
    let Some(object) = value.as_object() else {
        return Ok(NodeExecutionResult {
            status: NodeExecutionStatus::Continue,
            payload: value,
            route: None,
            diagnostics: journal.diagnostics,
            logs: journal.logs,
            wait: None,
            cache_writes: journal.cache_writes,
            freezer_writes: journal.freezer_writes,
            shell_invocations: journal.shell_invocations,
        });
    };

    let status = match object.get("status").and_then(Value::as_str) {
        Some("wait") => NodeExecutionStatus::Wait,
        Some("block") => NodeExecutionStatus::Blocked,
        Some("fail") => NodeExecutionStatus::Failed,
        Some("complete") => NodeExecutionStatus::Complete,
        _ => NodeExecutionStatus::Continue,
    };
    let payload = object.get("payload").cloned().unwrap_or(value.clone());
    let route = object
        .get("route")
        .and_then(Value::as_str)
        .map(ToOwned::to_owned);
    let wait = object
        .get("wait")
        .and_then(Value::as_object)
        .map(|wait| NodeWait {
            delay_ms: wait.get("delayMs").and_then(Value::as_u64),
            reason: wait
                .get("reason")
                .and_then(Value::as_str)
                .map(ToOwned::to_owned),
        });
    let diagnostics = with_messages(
        journal.diagnostics,
        object
            .get("diagnostics")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .filter_map(Value::as_str)
            .map(ToOwned::to_owned)
            .collect(),
    );

    Ok(NodeExecutionResult {
        status,
        payload,
        route,
        diagnostics,
        logs: journal.logs,
        wait,
        cache_writes: journal.cache_writes,
        freezer_writes: journal.freezer_writes,
        shell_invocations: journal.shell_invocations,
    })
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

fn with_message(mut messages: Vec<String>, message: String) -> Vec<String> {
    messages.push(message);
    messages
}

fn with_messages(mut messages: Vec<String>, additional: Vec<String>) -> Vec<String> {
    messages.extend(additional);
    messages
}

fn resolve_fixture_path(root: &Path, raw_path: &str) -> PathBuf {
    let path = PathBuf::from(raw_path);
    if path.is_absolute() {
        path
    } else {
        root.join(path)
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

    fn workspace_root() -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .expect("core should live in workspace root")
            .to_path_buf()
    }

    fn node_entrypoint(path: &str) -> PathBuf {
        workspace_root().join(path)
    }

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
        let root = workspace_root().join("nodes");
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

    #[test]
    fn sleep_node_returns_wait_outcome() {
        let result = execute_rhai_file_with_context(
            &node_entrypoint("nodes/std/sleep/main.rhai"),
            serde_json::json!({ "job": "demo" }),
            serde_json::json!({ "delay_ms": 25 }),
            &NodeExecutionHost::default(),
        )
        .expect("sleep node should execute");

        assert_eq!(result.status, NodeExecutionStatus::Wait);
        assert_eq!(result.wait.and_then(|wait| wait.delay_ms), Some(25));
    }

    #[test]
    fn cron_node_returns_wait_reason() {
        let result = execute_rhai_file_with_context(
            &node_entrypoint("nodes/std/cron/main.rhai"),
            serde_json::json!({ "job": "demo" }),
            serde_json::json!({ "schedule": "0 * * * *" }),
            &NodeExecutionHost::default(),
        )
        .expect("cron node should execute");

        assert_eq!(result.status, NodeExecutionStatus::Wait);
        assert_eq!(
            result.wait.and_then(|wait| wait.reason),
            Some("0 * * * *".to_owned())
        );
    }

    #[test]
    fn cache_node_prefers_cached_payloads() {
        let result = execute_rhai_file_with_context(
            &node_entrypoint("nodes/std/cache/main.rhai"),
            serde_json::json!({ "fresh": true }),
            serde_json::json!({ "key": "ticket-1" }),
            &NodeExecutionHost {
                cache_entries: BTreeMap::from([(
                    "ticket-1".to_owned(),
                    serde_json::json!({ "cached": true }),
                )]),
                freezer_entries: BTreeMap::new(),
                fixture_root: workspace_root(),
            },
        )
        .expect("cache node should execute");

        assert_eq!(result.status, NodeExecutionStatus::Continue);
        assert_eq!(result.payload, serde_json::json!({ "cached": true }));
    }

    #[test]
    fn freezer_node_returns_frozen_payloads() {
        let result = execute_rhai_file_with_context(
            &node_entrypoint("nodes/std/freezer/main.rhai"),
            serde_json::json!({ "fresh": true }),
            serde_json::json!({ "key": "ticket-1" }),
            &NodeExecutionHost {
                cache_entries: BTreeMap::new(),
                freezer_entries: BTreeMap::from([(
                    "ticket-1".to_owned(),
                    serde_json::json!({ "frozen": true }),
                )]),
                fixture_root: workspace_root(),
            },
        )
        .expect("freezer node should execute");

        assert_eq!(result.status, NodeExecutionStatus::Continue);
        assert_eq!(result.payload, serde_json::json!({ "frozen": true }));
    }

    #[test]
    fn codex_node_reads_fixture_payloads() {
        let result = execute_rhai_file_with_context(
            &node_entrypoint("nodes/codex/exec/main.rhai"),
            serde_json::json!({ "goal": "branch" }),
            serde_json::json!({
                "fixture": "examples/fixtures/clients-project/codex-select-branch.json"
            }),
            &NodeExecutionHost {
                cache_entries: BTreeMap::new(),
                freezer_entries: BTreeMap::new(),
                fixture_root: workspace_root(),
            },
        )
        .expect("codex node should execute");

        assert_eq!(result.status, NodeExecutionStatus::Continue);
        assert_eq!(result.payload["response"]["branch"], "feat/clients-project-mail-review");
    }

    #[test]
    fn debug_log_node_emits_runtime_logs() {
        let result = execute_rhai_file_with_context(
            &node_entrypoint("nodes/debug/log/main.rhai"),
            serde_json::json!({ "message": "hello" }),
            serde_json::json!({ "target": "console" }),
            &NodeExecutionHost::default(),
        )
        .expect("debug log node should execute");

        assert_eq!(result.status, NodeExecutionStatus::Continue);
        assert!(result
            .logs
            .iter()
            .any(|message| message.contains("debug/log received payload")));
    }

    #[test]
    fn placeholder_echo_node_passes_payload_through() {
        let result = execute_rhai_file_with_context(
            &node_entrypoint("nodes/debug/placeholder-echo/main.rhai"),
            serde_json::json!({ "echo": true }),
            serde_json::json!({}),
            &NodeExecutionHost::default(),
        )
        .expect("placeholder echo node should execute");

        assert_eq!(result.payload, serde_json::json!({ "echo": true }));
    }

    #[test]
    fn placeholder_rhai_node_marks_payload() {
        let result = execute_rhai_file_with_context(
            &node_entrypoint("nodes/debug/placeholder-rhai/main.rhai"),
            serde_json::json!({ "echo": true }),
            serde_json::json!({ "note": "draft" }),
            &NodeExecutionHost::default(),
        )
        .expect("placeholder rhai node should execute");

        assert_eq!(result.payload["placeholder"], true);
    }

    #[test]
    fn note_node_returns_no_output() {
        let result = execute_rhai_file_with_context(
            &node_entrypoint("nodes/debug/note/main.rhai"),
            serde_json::json!({ "echo": true }),
            serde_json::json!({ "note": "draft" }),
            &NodeExecutionHost::default(),
        )
        .expect("note node should execute");

        assert_eq!(result.payload, Value::Null);
    }
}
