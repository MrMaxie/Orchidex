## 1. Contracts And Strategies

- [ ] 1.1 Extend TypeScript contracts to mirror v1 Rust runtime commands and events.
- [x] 1.1.a Add typed node catalog discovery contracts for runtime-backed workspace metadata.
- [x] 1.1.b Split project metadata, workflow graph data, project `cwd`, last-opened workflow state, and spark-derived activity in workspace contracts.
- [x] 1.1.c Extend graph edge contracts and TypeScript edge mapping with source/target port handles while preserving non-rendered routing metadata.
- [ ] 1.2 Add HTTP strategy support for node catalog, queue/manual controls, run history, and v1 runtime events.
- [x] 1.2.a Add HTTP node catalog fetching alongside existing graph and spark operations.
- [ ] 1.3 Add Tauri IPC strategy support for the same commands and events without CLI or HTTP.
- [x] 1.3.a Add Tauri IPC node catalog fetching alongside existing graph and spark operations.

## 2. Workspace UI

- [ ] 2.1 Load node catalog data from core and render it in the workspace catalog.
- [x] 2.1.a Load runtime-backed node catalog entries in the workspace with a static fallback while core is unavailable.
- [ ] 2.2 Render live spark locations, edge transitions, node process states, waiting states, blocked diagnostics, and failures.
- [ ] 2.3 Support live graph editing while preserving runtime reconciliation feedback.
- [ ] 2.4 Replace workflow-level start/stop/status UI with spark actions and spark-derived activity indicators.
- [ ] 2.5 Make the central ReactFlow canvas the full primary workspace surface with compact hover/overlay controls for add node, mode, zoom, fit, and selection actions.
- [ ] 2.6 Add Dashboard-first explorer navigation, restore last opened workflow, and fall back to Dashboard when no workflow has been opened.
- [ ] 2.7 Add GUI flows for creating projects, creating workflows, duplicating workflows, and editing each project's `cwd` path.
- [ ] 2.8 Fix ReactFlow controls readability, reduce minimap footprint by about half, apply design color tokens to status/selection UI, and keep edge text hidden by default.
- [x] 2.9 Support edge detach, reconnect, and delete interactions for port-aware graph edges.

## 3. Validation

- [ ] 3.1 Add web contract tests for connection strategy behavior.
- [x] 3.1.a Add backend coverage for the node catalog transport contract and run web type/build validation for the workspace slice.
- [ ] 3.1.b Add workspace tests for Dashboard fallback, last-opened workflow restore, project/workflow creation, workflow duplication, project `cwd`, spark-derived activity, and port-aware edge editing.
- [ ] 3.2 Verify the workspace in a live browser and desktop window when UI behavior changes.
- [x] 3.2.a Verify the runtime-backed node catalog flow in a live browser against the local core server.
- [ ] 3.3 Run `bun run check`, `bun run build:web`, and relevant Rust tests.
