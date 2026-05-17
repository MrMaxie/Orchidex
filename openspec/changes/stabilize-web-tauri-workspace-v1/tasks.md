## 1. Contracts And Strategies

- [ ] 1.1 Extend TypeScript contracts to mirror v1 Rust runtime commands and events.
- [x] 1.1.a Add typed node catalog discovery contracts for runtime-backed workspace metadata.
- [ ] 1.2 Add HTTP strategy support for node catalog, queue/manual controls, run history, and v1 runtime events.
- [x] 1.2.a Add HTTP node catalog fetching alongside existing graph and spark operations.
- [ ] 1.3 Add Tauri IPC strategy support for the same commands and events without CLI or HTTP.
- [x] 1.3.a Add Tauri IPC node catalog fetching alongside existing graph and spark operations.

## 2. Workspace UI

- [ ] 2.1 Load node catalog data from core and render it in the workspace catalog.
- [x] 2.1.a Load runtime-backed node catalog entries in the workspace with a static fallback while core is unavailable.
- [ ] 2.2 Render live spark locations, edge transitions, node process states, waiting states, blocked diagnostics, and failures.
- [ ] 2.3 Support live graph editing while preserving runtime reconciliation feedback.

## 3. Validation

- [ ] 3.1 Add web contract tests for connection strategy behavior.
- [x] 3.1.a Add backend coverage for the node catalog transport contract and run web type/build validation for the workspace slice.
- [ ] 3.2 Verify the workspace in a live browser and desktop window when UI behavior changes.
- [x] 3.2.a Verify the runtime-backed node catalog flow in a live browser against the local core server.
- [ ] 3.3 Run `bun run check`, `bun run build:web`, and relevant Rust tests.
