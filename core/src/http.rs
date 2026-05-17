use crate::models::{
    Graph, IgniteSparkRequest, NodeCatalogResponse, ResolveManualGateRequest, RunHistoryEntry,
    RuntimeDiagnostic, RuntimeEvent, SparkTraceStep,
};
use crate::runtime::RuntimeHandle;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::sse::{Event, KeepAlive, Sse};
use axum::routing::{get, post};
use axum::{Json, Router};
use std::convert::Infallible;
use std::net::SocketAddr;
use tokio_stream::wrappers::BroadcastStream;
use tokio_stream::StreamExt;
use tower_http::cors::CorsLayer;

pub fn router(runtime: RuntimeHandle) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/graph", get(get_graph).put(replace_graph))
        .route("/nodes", get(get_node_catalog))
        .route("/sparks", post(ignite_spark))
        .route("/sparks/extinguish", post(extinguish_sparks))
        .route("/runtime/queues/:node_id/release", post(release_queue))
        .route("/runtime/manual/resolve", post(resolve_manual_gate))
        .route("/runtime/history", get(get_run_history))
        .route("/runtime/diagnostics", get(get_diagnostics))
        .route("/runtime/traces", get(get_traces))
        .route("/events", get(events))
        .layer(CorsLayer::permissive())
        .with_state(runtime)
}

pub async fn serve(runtime: RuntimeHandle, addr: SocketAddr) -> anyhow::Result<()> {
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, router(runtime)).await?;
    Ok(())
}

async fn health() -> &'static str {
    "ok"
}

async fn get_graph(State(runtime): State<RuntimeHandle>) -> Result<Json<Graph>, ApiError> {
    Ok(Json(runtime.graph()?))
}

async fn replace_graph(
    State(runtime): State<RuntimeHandle>,
    Json(graph): Json<Graph>,
) -> Result<Json<Graph>, ApiError> {
    Ok(Json(runtime.replace_graph(graph)?))
}

async fn get_node_catalog(
    State(runtime): State<RuntimeHandle>,
) -> Result<Json<NodeCatalogResponse>, ApiError> {
    Ok(Json(runtime.node_catalog()))
}

async fn ignite_spark(
    State(runtime): State<RuntimeHandle>,
    Json(request): Json<IgniteSparkRequest>,
) -> Result<Json<crate::models::Spark>, ApiError> {
    Ok(Json(runtime.ignite(request)?))
}

async fn extinguish_sparks(State(runtime): State<RuntimeHandle>) -> Result<Json<usize>, ApiError> {
    Ok(Json(runtime.extinguish_all()?))
}

async fn release_queue(
    State(runtime): State<RuntimeHandle>,
    Path(node_id): Path<String>,
) -> Result<Json<usize>, ApiError> {
    Ok(Json(runtime.release_queue(&node_id)?))
}

async fn resolve_manual_gate(
    State(runtime): State<RuntimeHandle>,
    Json(request): Json<ResolveManualGateRequest>,
) -> Result<Json<crate::models::Spark>, ApiError> {
    Ok(Json(runtime.resolve_manual_gate(request)?))
}

async fn get_run_history(
    State(runtime): State<RuntimeHandle>,
) -> Result<Json<Vec<RunHistoryEntry>>, ApiError> {
    Ok(Json(runtime.run_history()?))
}

async fn get_diagnostics(
    State(runtime): State<RuntimeHandle>,
) -> Result<Json<Vec<RuntimeDiagnostic>>, ApiError> {
    Ok(Json(runtime.diagnostics()?))
}

async fn get_traces(
    State(runtime): State<RuntimeHandle>,
) -> Result<Json<Vec<SparkTraceStep>>, ApiError> {
    Ok(Json(runtime.traces()?))
}

async fn events(
    State(runtime): State<RuntimeHandle>,
) -> Sse<impl tokio_stream::Stream<Item = Result<Event, Infallible>>> {
    let stream = BroadcastStream::new(runtime.subscribe()).filter_map(|event| {
        let event = match event {
            Ok(event) => event,
            Err(_) => return None,
        };
        let data = serde_json::to_string(&event).ok()?;
        let name = match event {
            RuntimeEvent::GraphUpdated { .. } => "graph-updated",
            RuntimeEvent::SparkIgnited { .. } => "spark-ignited",
            RuntimeEvent::SparkMoved { .. } => "spark-moved",
            RuntimeEvent::NodeStatusChanged { .. } => "node-status-changed",
            RuntimeEvent::SparkBlocked { .. } => "spark-blocked",
            RuntimeEvent::SparkWaiting { .. } => "spark-waiting",
            RuntimeEvent::SparkFailed { .. } => "spark-failed",
            RuntimeEvent::SparkCompleted { .. } => "spark-completed",
            RuntimeEvent::SparkExtinguished { .. } => "spark-extinguished",
            RuntimeEvent::AllSparksExtinguished => "all-sparks-extinguished",
            RuntimeEvent::QueueChanged { .. } => "queue-changed",
            RuntimeEvent::ManualGateChanged { .. } => "manual-gate-changed",
            RuntimeEvent::DiagnosticRecorded { .. } => "diagnostic-recorded",
            RuntimeEvent::Log { .. } => "log",
        };
        Some(Ok(Event::default().event(name).data(data)))
    });

    Sse::new(stream).keep_alive(KeepAlive::default())
}

struct ApiError(anyhow::Error);

impl<E> From<E> for ApiError
where
    E: Into<anyhow::Error>,
{
    fn from(error: E) -> Self {
        Self(error.into())
    }
}

impl axum::response::IntoResponse for ApiError {
    fn into_response(self) -> axum::response::Response {
        (StatusCode::BAD_REQUEST, self.0.to_string()).into_response()
    }
}
