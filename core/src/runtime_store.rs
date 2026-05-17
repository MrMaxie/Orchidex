use crate::models::RuntimeSnapshot;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Clone, Debug)]
pub struct RuntimeStore {
    root: PathBuf,
}

impl RuntimeStore {
    pub fn new(root: PathBuf) -> Self {
        Self { root }
    }

    pub fn load_snapshot(&self) -> anyhow::Result<Option<RuntimeSnapshot>> {
        let path = self.snapshot_path();
        if !path.exists() {
            return Ok(None);
        }

        let content = fs::read_to_string(&path)?;
        let snapshot = serde_json::from_str::<RuntimeSnapshot>(&content)?;
        Ok(Some(snapshot))
    }

    pub fn write_snapshot(&self, snapshot: &RuntimeSnapshot) -> anyhow::Result<()> {
        fs::create_dir_all(&self.root)?;
        let content = serde_json::to_string_pretty(snapshot)?;
        fs::write(self.snapshot_path(), content)?;
        Ok(())
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    fn snapshot_path(&self) -> PathBuf {
        self.root.join("runtime-state.json")
    }
}
