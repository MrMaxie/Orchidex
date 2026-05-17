use crate::models::{Graph, IgniteSparkRequest, RuntimeEvent};
use crate::runtime::RuntimeHandle;
use std::path::Path;
use tokio::time::{timeout, Duration};

pub async fn run_clients_project_fixture(graph_path: &Path) -> anyhow::Result<()> {
    let graph = std::fs::read_to_string(graph_path)
        .ok()
        .and_then(|content| serde_json::from_str::<Graph>(&content).ok())
        .unwrap_or_else(crate::models::default_graph);
    let runtime = RuntimeHandle::new(graph);
    let mut rx = runtime.subscribe();
    let spark = runtime.ignite(IgniteSparkRequest {
        node_id: "manual-start".to_owned(),
        payload: serde_json::json!({
            "source": "fixture",
            "mailThread": "mock-pr-response",
            "codex": "fixture-only"
        }),
    })?;

    let mut movements = 0;
    while let Ok(Ok(event)) = timeout(Duration::from_secs(2), rx.recv()).await {
        if matches!(event, RuntimeEvent::SparkMoved { .. }) {
            movements += 1;
        }
        if matches!(event, RuntimeEvent::NodeStatusChanged { node_id, status } if node_id == "codex-plan" && status == crate::models::NodeStatus::Done)
        {
            break;
        }
        if movements >= 4 {
            break;
        }
    }

    println!(
        "Scenario clients-project completed with spark {} and {movements} movements. Codex output came from fixture.",
        spark.id
    );
    Ok(())
}
