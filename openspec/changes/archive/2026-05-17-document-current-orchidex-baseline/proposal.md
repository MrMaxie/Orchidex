## Why

Orchidex already has a working early monorepo skeleton, but OpenSpec has no baseline specs. Capturing the current state gives v1 planning a stable source of truth before larger runtime, node, UI, portal, and autonomous-flow changes are proposed.

## What Changes

- Document the current three-part monorepo architecture: Rust core, reusable React web workspace, and Tauri desktop shell.
- Document the current minimal runtime contracts, including in-memory graph state, spark movement, HTTP/SSE development transport, and Tauri IPC transport.
- Document the current folder-based node catalog and Rhai placeholder execution support.
- Document the current fixture-backed acceptance assets, especially the `clients-project` scenario and frozen Codex responses.
- No product code behavior changes are included in this baseline.

## Capabilities

### New Capabilities
- `architecture`: Current monorepo boundaries and ownership between `core`, `web`, and `tauri`.
- `runtime-contracts`: Current graph, spark, event, command, HTTP/SSE, and IPC contracts.
- `node-catalog`: Current folder-based node manifests, Rhai entrypoints, and node authoring conventions.
- `acceptance-fixtures`: Current fixture and mock assets used for acceptance-style validation.

### Modified Capabilities

None.

## Impact

- Affected artifacts are limited to OpenSpec baseline files under `openspec/`.
- The baseline references current repo files such as `README.md`, `AGENTS.md`, `core/`, `web/`, `tauri/`, `nodes/`, and `examples/fixtures/`.
- No runtime API, package dependency, build command, or product behavior is changed.
