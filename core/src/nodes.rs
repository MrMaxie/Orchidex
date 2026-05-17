use crate::models::{NodeCatalogDiagnostic, NodeCatalogEntry, NodeCatalogResponse};
use rhai::{Dynamic, Engine, Map, Scope};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeMap;
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
}

#[derive(Debug, Error)]
pub enum NodeRegistryError {
    #[error("failed to read node file '{path}': {source}")]
    Read {
        path: PathBuf,
        source: std::io::Error,
    },
    #[error("failed to parse node manifest '{path}': {source}")]
    Parse {
        path: PathBuf,
        source: toml::de::Error,
    },
}

#[derive(Clone, Debug, Default)]
pub struct NodeRegistry {
    manifests: BTreeMap<String, NodeManifest>,
}

impl NodeRegistry {
    pub fn load_from(root: impl AsRef<Path>) -> Result<Self, NodeRegistryError> {
        let root = root.as_ref();
        let mut registry = Self::default();
        if !root.exists() {
            return Ok(registry);
        }
        registry.walk(root)?;
        Ok(registry)
    }

    pub fn catalog(&self) -> Vec<NodeCatalogEntry> {
        self.manifests
            .values()
            .map(|manifest| NodeCatalogEntry {
                id: manifest.id.clone(),
                label: manifest.label.clone(),
                description: manifest.description.clone(),
                capabilities: manifest.capabilities.clone(),
                config_schema: manifest.config_schema.clone(),
                input_schema: manifest.input_schema.clone(),
                output_schema: manifest.output_schema.clone(),
            })
            .collect()
    }

    pub fn get(&self, id: &str) -> Option<&NodeManifest> {
        self.manifests.get(id)
    }

    fn walk(&mut self, dir: &Path) -> Result<(), NodeRegistryError> {
        let manifest_path = dir.join("node.toml");
        if manifest_path.exists() {
            let content =
                fs::read_to_string(&manifest_path).map_err(|source| NodeRegistryError::Read {
                    path: manifest_path.clone(),
                    source,
                })?;
            let manifest: NodeManifest =
                toml::from_str(&content).map_err(|source| NodeRegistryError::Parse {
                    path: manifest_path,
                    source,
                })?;
            self.manifests.insert(manifest.id.clone(), manifest);
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
                self.walk(&entry.path())?;
            }
        }
        Ok(())
    }
}

pub fn discover_node_catalog(root: impl AsRef<Path>) -> NodeCatalogResponse {
    let root = root.as_ref();
    let mut entries = Vec::new();
    let mut diagnostics = Vec::new();
    if !root.exists() {
        return NodeCatalogResponse {
            entries,
            diagnostics,
        };
    }

    walk_catalog(root, &mut entries, &mut diagnostics);
    entries.sort_by(|left, right| left.id.cmp(&right.id));
    diagnostics.sort_by(|left, right| left.path.cmp(&right.path));

    NodeCatalogResponse {
        entries,
        diagnostics,
    }
}

fn walk_catalog(
    dir: &Path,
    entries: &mut Vec<NodeCatalogEntry>,
    diagnostics: &mut Vec<NodeCatalogDiagnostic>,
) {
    let manifest_path = dir.join("node.toml");
    if manifest_path.exists() {
        match fs::read_to_string(&manifest_path) {
            Ok(content) => match toml::from_str::<NodeManifest>(&content) {
                Ok(manifest) => {
                    entries.push(NodeCatalogEntry {
                        id: manifest.id,
                        label: manifest.label,
                        description: manifest.description,
                        capabilities: manifest.capabilities,
                        config_schema: manifest.config_schema,
                        input_schema: manifest.input_schema,
                        output_schema: manifest.output_schema,
                    });
                }
                Err(source) => diagnostics.push(NodeCatalogDiagnostic {
                    path: manifest_path.display().to_string(),
                    message: source.to_string(),
                    node_id: None,
                }),
            },
            Err(source) => diagnostics.push(NodeCatalogDiagnostic {
                path: manifest_path.display().to_string(),
                message: source.to_string(),
                node_id: None,
            }),
        }
    }

    let read_dir = match fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(source) => {
            diagnostics.push(NodeCatalogDiagnostic {
                path: dir.display().to_string(),
                message: source.to_string(),
                node_id: None,
            });
            return;
        }
    };

    for entry in read_dir {
        match entry {
            Ok(entry) => {
                if entry
                    .file_type()
                    .map(|file_type| file_type.is_dir())
                    .unwrap_or(false)
                {
                    walk_catalog(&entry.path(), entries, diagnostics);
                }
            }
            Err(source) => diagnostics.push(NodeCatalogDiagnostic {
                path: dir.display().to_string(),
                message: source.to_string(),
                node_id: None,
            }),
        }
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
}
