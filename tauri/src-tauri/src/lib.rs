use orchidex_core::{
    Graph, IgniteSparkRequest, NodeCatalogResponse, RunHistoryEntry, RuntimeDiagnostic,
    RuntimeHandle, Spark, SparkTraceStep,
};
use tauri::{Emitter, State};

#[tauri::command]
fn get_graph(runtime: State<'_, RuntimeHandle>) -> Result<Graph, String> {
    runtime.graph().map_err(|error| error.to_string())
}

#[tauri::command]
fn replace_graph(runtime: State<'_, RuntimeHandle>, graph: Graph) -> Result<Graph, String> {
    runtime
        .replace_graph(graph)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn get_node_catalog(runtime: State<'_, RuntimeHandle>) -> Result<NodeCatalogResponse, String> {
    Ok(runtime.node_catalog())
}

#[tauri::command]
fn ignite_spark(
    runtime: State<'_, RuntimeHandle>,
    request: IgniteSparkRequest,
) -> Result<Spark, String> {
    runtime.ignite(request).map_err(|error| error.to_string())
}

#[tauri::command]
fn extinguish_sparks(runtime: State<'_, RuntimeHandle>) -> Result<usize, String> {
    runtime.extinguish_all().map_err(|error| error.to_string())
}

#[tauri::command]
fn get_run_history(runtime: State<'_, RuntimeHandle>) -> Result<Vec<RunHistoryEntry>, String> {
    runtime.run_history().map_err(|error| error.to_string())
}

#[tauri::command]
fn get_runtime_diagnostics(
    runtime: State<'_, RuntimeHandle>,
) -> Result<Vec<RuntimeDiagnostic>, String> {
    runtime.diagnostics().map_err(|error| error.to_string())
}

#[tauri::command]
fn get_runtime_traces(runtime: State<'_, RuntimeHandle>) -> Result<Vec<SparkTraceStep>, String> {
    runtime.traces().map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let runtime = RuntimeHandle::demo();
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(runtime.clone())
        .setup(move |app| {
            let app_handle = app.handle().clone();
            let mut rx = runtime.subscribe();
            tauri::async_runtime::spawn(async move {
                while let Ok(event) = rx.recv().await {
                    let _ = app_handle.emit("orchidex://runtime-event", event);
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_graph,
            get_node_catalog,
            replace_graph,
            ignite_spark,
            extinguish_sparks,
            get_run_history,
            get_runtime_diagnostics,
            get_runtime_traces
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
