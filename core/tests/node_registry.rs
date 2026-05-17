use orchidex_core::{NodeRegistry, RuntimeHandle};
use std::path::PathBuf;

#[test]
fn loads_standard_node_catalog() {
    let nodes_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("core should live in workspace root")
        .join("nodes");
    let registry = NodeRegistry::load_from(nodes_dir).expect("node registry should load");
    let catalog = registry.catalog();
    assert!(catalog.iter().any(|node| node.id == "std/manual-ignite"));
    assert!(catalog.iter().any(|node| node.id == "codex/exec"));
}

#[tokio::test]
async fn extinguish_on_empty_runtime_is_safe() {
    let runtime = RuntimeHandle::demo();
    assert_eq!(runtime.extinguish_all().expect("extinguish should work"), 0);
}
