use orchidex_core::nodes::{execute_rhai_file_with_context, NodeExecutionHost, NodeExecutionStatus};
use orchidex_core::scenarios::run_clients_project_fixture;
use std::collections::BTreeMap;
use std::path::PathBuf;

fn workspace_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("core should live in workspace root")
        .to_path_buf()
}

#[tokio::test]
async fn clients_project_fixture_runs_without_live_codex() {
    let graph_path = workspace_root().join("examples/fixtures/clients-project/graph.json");

    run_clients_project_fixture(&graph_path)
        .await
        .expect("fixture scenario should complete");
}

#[test]
fn cache_and_freezer_nodes_use_fixture_first_state() {
    let workspace_root = workspace_root();

    let cache_result = execute_rhai_file_with_context(
        &workspace_root.join("nodes/std/cache/main.rhai"),
        serde_json::json!({ "fresh": true }),
        serde_json::json!({ "key": "ticket-7" }),
        &NodeExecutionHost {
            cache_entries: BTreeMap::from([(
                "ticket-7".to_owned(),
                serde_json::json!({ "cached": true }),
            )]),
            freezer_entries: BTreeMap::new(),
            fixture_root: workspace_root.clone(),
        },
    )
    .expect("cache node should execute");

    let freezer_result = execute_rhai_file_with_context(
        &workspace_root.join("nodes/std/freezer/main.rhai"),
        serde_json::json!({ "fresh": true }),
        serde_json::json!({ "key": "ticket-7" }),
        &NodeExecutionHost {
            cache_entries: BTreeMap::new(),
            freezer_entries: BTreeMap::from([(
                "ticket-7".to_owned(),
                serde_json::json!({ "frozen": true }),
            )]),
            fixture_root: workspace_root,
        },
    )
    .expect("freezer node should execute");

    assert_eq!(cache_result.status, NodeExecutionStatus::Continue);
    assert_eq!(cache_result.payload["cached"], true);
    assert_eq!(freezer_result.status, NodeExecutionStatus::Continue);
    assert_eq!(freezer_result.payload["frozen"], true);
}
