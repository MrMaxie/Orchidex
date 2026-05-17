## Why

The repository has the v1 candidate node folders, manifests, and Rhai placeholders, but the runtime does not yet enforce the behavior of those nodes. v1 needs a reliable node system so graphs can express reusable procedures instead of requiring manual orchestration.

## What Changes

- Define the v1 node execution contract for manifest discovery, Rhai entrypoints, host APIs, schemas, diagnostics, and shell delegation.
- Specify the full v1 standard/debug/Codex node catalog and each node's required behavior.
- Add fixture-first Codex execution and local cache/freezer semantics.
- Keep node authoring skill-backed and folder-based.

## Capabilities

### New Capabilities
- `standard-node-behaviors`: Expected behavior for standard v1 nodes such as manual ignite, transmute, accumulation, filter, merge, manual accept, sleep, cron, cache, and freezer.
- `debug-node-behaviors`: Expected behavior for debug and placeholder nodes.
- `codex-exec-node`: Expected fixture-first Codex CLI node behavior.
- `node-cache-freezer`: Expected persistent cache and permanent freezer behavior.

### Modified Capabilities
- `node-manifest-format`: Extend manifests from metadata-only hints into executable node contracts.
- `node-registry`: Extend discovery into runtime-backed catalog and executable lookup.
- `rhai-node-execution-helper`: Replace placeholder host APIs with runtime-owned node execution APIs.
- `standard-node-placeholders`: Replace placeholder entrypoints with v1 node behavior.
- `fixture-codex-policy`: Extend fixture-first policy to all Codex-backed automated scenarios.
- `agent-node-authoring-skill`: Update skill guidance for v1 node authoring.

## Impact

- Affects `nodes/`, `core/src/nodes.rs`, runtime node execution, fixture storage, acceptance scenarios, and `.agents/skills/orchidex-node-authoring/`.
- Requires future tests for every v1 node and fixture-first Codex execution.
