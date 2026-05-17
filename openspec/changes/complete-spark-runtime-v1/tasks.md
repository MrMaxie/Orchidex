## 1. Runtime State And Contracts

- [x] 1.1 Define the v1 spark state machine and node execution outcome model in Rust.
- [x] 1.1.a Ensure runtime contracts expose spark-derived activity summaries without workflow-level start, stop, or running state.
- [ ] 1.2 Add local file-backed storage for graphs, active sparks, run history, queues, diagnostics, and replay metadata.
- [x] 1.3 Extend runtime commands and events for waiting, blocking, failure, completion, queue release, manual resolution, and run history inspection.

## 2. Execution Engine

- [x] 2.1 Wire node registry and Rhai execution into spark advancement.
- [x] 2.2 Support concurrent sparks with deterministic per-spark traces and extinguish-all cancellation.
- [ ] 2.3 Reconcile live graph edits against active sparks and blocked routes.

## 3. Validation

- [x] 3.1 Add Rust tests for concurrent sparks, extinguish-all, live edits, failure states, waiting states, and persistence replay.
- [x] 3.1.a Add contract coverage proving workflow activity is derived from spark events and not from a persisted workflow status field.
- [x] 3.2 Update fixture scenario coverage for the v1 runtime path.
- [x] 3.3 Run `cargo test --workspace`, `bun run check`, `bun run build:web`, and `bun run core -- run-scenario`.
