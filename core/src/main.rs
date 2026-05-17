#[tokio::main]
async fn main() -> anyhow::Result<()> {
    orchidex_core::cli::run().await
}
