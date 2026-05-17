## 1. Contracts And Strategies

- [ ] 1.1 Extend TypeScript contracts to mirror v1 Rust runtime commands and events.
- [ ] 1.2 Add HTTP strategy support for node catalog, queue/manual controls, run history, and v1 runtime events.
- [ ] 1.3 Add Tauri IPC strategy support for the same commands and events without CLI or HTTP.

## 2. Workspace UI

- [ ] 2.1 Load node catalog data from core and render it in the workspace catalog.
- [ ] 2.2 Render live spark locations, edge transitions, node process states, waiting states, blocked diagnostics, and failures.
- [ ] 2.3 Support live graph editing while preserving runtime reconciliation feedback.

## 3. Validation

- [ ] 3.1 Add web contract tests for connection strategy behavior.
- [ ] 3.2 Verify the workspace in a live browser and desktop window when UI behavior changes.
- [ ] 3.3 Run `bun run check`, `bun run build:web`, and relevant Rust tests.
