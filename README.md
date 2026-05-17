<p align="center">
  <img src="./web/public/logo.png" alt="Orchidex logo" width="120" />
</p>

# Orchidex

Orchidex is a spark-driven graph workspace for automating technical work across web and desktop.
The project is now organized as a three-part monorepo: Rust core runtime, reusable React workspace, and Tauri desktop shell.

## Architecture

- `core/` is the Rust source of truth for graph contracts, spark runtime, node loading, CLI commands, and the HTTP/SSE dev server.
- `web/` exports `OrchidexWorkspace`, a React component that talks to a typed `ConnectionStrategy`.
- `tauri/` embeds the web package and calls `core` directly through Tauri IPC.
- `nodes/` contains folder-based node definitions with `node.toml` and `main.rhai`.
- `examples/fixtures/` contains fixture-backed acceptance scenarios such as `clients-project`.

## Core Concepts

- A spark is a running task that moves between graph nodes and carries a JSON payload.
- Many sparks can run at the same time, and all active sparks can be extinguished together.
- The graph remains editable while sparks move; invalid live edits block affected sparks instead of crashing the runtime.
- In web development, the GUI talks to `core serve` through REST commands and SSE runtime events.
- In desktop mode, the GUI uses the same contracts through Tauri IPC without CLI or HTTP.

## Quick Start

```bash
bun install
bun run core:serve
bun run dev
```

Run the desktop shell:

```bash
bun run tauri dev
```

Build the web target:

```bash
bun run build
```

Run Rust validation:

```bash
cargo test --workspace
cargo check --workspace
```

Run the mock acceptance scenario:

```bash
bun run core -- run-scenario
```

## Node Authoring

Each node lives in its own folder:

```text
nodes/std/transmute/
  node.toml
  main.rhai
```

Use `.agents/skills/orchidex-node-authoring/` for the node lifecycle, Rhai host API, shell delegation examples, and fixture-first Codex guidance.

## Project Status

Orchidex has the initial monorepo boundaries, runtime contracts, fixture-backed standard node catalog, HTTP/SSE development path, and Tauri IPC path in place. The runtime is intentionally minimal but complete enough to ignite sparks, move them through the graph, emit live events, extinguish active work, and surface blocked sparks after live graph edits.
