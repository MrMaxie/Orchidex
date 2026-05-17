use crate::http;
use crate::models::IgniteSparkRequest;
use crate::runtime::RuntimeHandle;
use crate::scenarios;
use clap::{Parser, Subcommand};
use std::net::SocketAddr;
use std::path::PathBuf;

#[derive(Debug, Parser)]
#[command(name = "orchidex-core")]
#[command(about = "Run the Orchidex core runtime.")]
pub struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Debug, Subcommand)]
enum Command {
    Serve {
        #[arg(long, default_value = "127.0.0.1:3869")]
        addr: SocketAddr,
    },
    RunScenario {
        #[arg(long, default_value = "examples/fixtures/clients-project/graph.json")]
        graph: PathBuf,
    },
    Ignite {
        #[arg(long, default_value = "manual-start")]
        node: String,
    },
    Extinguish,
}

pub async fn run() -> anyhow::Result<()> {
    let cli = Cli::parse();
    match cli.command {
        Command::Serve { addr } => {
            let runtime = RuntimeHandle::demo();
            println!("Orchidex core listening on http://{addr}");
            http::serve(runtime, addr).await
        }
        Command::RunScenario { graph } => scenarios::run_clients_project_fixture(&graph).await,
        Command::Ignite { node } => {
            let runtime = RuntimeHandle::demo();
            let spark = runtime.ignite(IgniteSparkRequest {
                node_id: node,
                payload: serde_json::json!({ "source": "cli" }),
            })?;
            println!("{}", serde_json::to_string_pretty(&spark)?);
            Ok(())
        }
        Command::Extinguish => {
            let runtime = RuntimeHandle::demo();
            let count = runtime.extinguish_all()?;
            println!("Extinguished {count} active sparks");
            Ok(())
        }
    }
}
