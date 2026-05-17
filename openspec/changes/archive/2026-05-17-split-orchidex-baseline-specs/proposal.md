## Why

The first baseline captured Orchidex in only four broad specs. That is too coarse for a project whose responsibilities are already split across Rust core runtime, HTTP/SSE, reusable web workspace, Tauri IPC, node manifests, Rhai execution, fixtures, and agent workflows.

## What Changes

- Add granular current-state capabilities for the existing repository shape.
- Separate current behavior from future v1 expectations by naming responsibilities directly and keeping v1 deltas in active changes.
- Document current assumptions with enough precision that later implementation work can target a clear ownership boundary.
- Do not change product code.

## Capabilities

### New Capabilities
- `repo-workspace`: Current workspace package layout, package managers, and command ownership.
- `source-of-truth-conventions`: Current documentation, language, dependency, and `.local` repository conventions.
- `core-graph-model`: Current Rust graph, node, edge, payload, and status data contracts.
- `core-spark-runtime`: Current in-memory spark runtime behavior and limitations.
- `core-runtime-events`: Current runtime event stream shape and event responsibility.
- `core-http-sse-transport`: Current HTTP command and SSE event transport.
- `core-cli`: Current `orchidex-core` CLI command surface.
- `web-workspace-component`: Current reusable React workspace component boundary.
- `web-connection-strategies`: Current HTTP and Tauri connection strategy resolution.
- `web-runtime-visualization`: Current workspace state rendering and runtime event consumption.
- `tauri-desktop-shell`: Current Tauri shell ownership and desktop packaging boundary.
- `tauri-ipc-transport`: Current Tauri IPC command and event bridge.
- `node-manifest-format`: Current `node.toml` metadata and schema hint format.
- `node-registry`: Current node registry discovery and catalog generation behavior.
- `rhai-node-execution-helper`: Current Rhai helper behavior and host API stubs.
- `standard-node-placeholders`: Current standard, debug, and Codex node placeholder inventory.
- `fixture-clients-project`: Current `clients-project` fixture graph and mock assets.
- `fixture-codex-policy`: Current fixture-first Codex testing convention.
- `agent-node-authoring-skill`: Current repo-local node authoring skill expectations.
- `validation-commands`: Current validation and development command expectations.

### Modified Capabilities

None.

## Impact

- Affects OpenSpec artifacts only.
- The existing broad baseline specs remain valid but are no longer the only place where current state is described.
- Future v1 changes can target these granular capabilities instead of broad catch-all specs.
