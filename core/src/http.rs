use crate::models::{Graph, IgniteSparkRequest, NodeCatalogResponse, RuntimeEvent};
use crate::runtime::RuntimeHandle;
use axum::extract::State;
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
            RuntimeEvent::SparkExtinguished { .. } => "spark-extinguished",
            RuntimeEvent::AllSparksExtinguished => "all-sparks-extinguished",
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
