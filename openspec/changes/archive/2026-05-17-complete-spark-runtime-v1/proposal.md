## Why

The current runtime is intentionally minimal: sparks move in memory across the first outgoing edge, node logic is not yet executed by the runtime, and run state is not durable. v1 needs a complete but still focused spark runner that can execute unattended flows while remaining inspectable and interruptible by the user.

## What Changes

- Upgrade runtime semantics from demo advancement to real node execution driven by graph topology and node outcomes.
- Add deterministic handling for concurrent sparks, extinguish-all, live graph edits, blocking, waiting, failures, retries, and completion.
- Add local file-backed run state for graphs, sparks, queues, run history, and diagnostics.
- Add runtime commands and events needed by web, HTTP/SSE, and Tauri IPC clients.
- Keep the Rust core as the source of truth for runtime contracts.

## Capabilities

### New Capabilities
- `runtime-state-persistence`: Local file-backed state for graphs, active sparks, queues, run history, and replay metadata.
- `runtime-diagnostics`: User-readable and machine-readable diagnostics for blocked, failed, waiting, completed, and extinguished work.

### Modified Capabilities
- `core-spark-runtime`: Upgrade the current minimal in-memory edge mover into the v1 spark execution engine.
- `core-runtime-events`: Extend the current event stream to cover v1 runtime states, traces, queues, manual gates, diagnostics, and cancellation.

## Impact

- Affects `core/` runtime, graph validation, runtime events, HTTP routes, Tauri IPC commands, TypeScript mirrored contracts, and acceptance fixtures.
- Requires future validation with `cargo test --workspace`, `bun run check`, `bun run build:web`, and `bun run core -- run-scenario`.
- Does not require a database; v1 uses local file-backed persistence unless a later change selects a database.
