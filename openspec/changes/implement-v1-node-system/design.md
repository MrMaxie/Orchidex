## Context

`NodeRegistry` can load `node.toml` manifests and `execute_rhai_entrypoint` can run simple Rhai scripts, but v1 node behavior is not yet enforced by the runtime. Existing `main.rhai` files are placeholders and most host APIs are stubs.

## Goals / Non-Goals

**Goals:**
- Make folder-based nodes executable runtime units.
- Keep node payloads JSON-compatible.
- Provide host APIs for logs, shell delegation, cache, freezer, scheduling, and Codex fixtures.
- Make all v1 node ids available and testable.
- Standardize node input and output ports so the workspace and runtime can validate port-aware graph edges.

**Non-Goals:**
- Do not require every node to call external tools.
- Do not allow tests to repeatedly invoke live Codex.
- Do not replace Rhai with another node language for v1.

## Decisions

- `node.toml` remains the metadata and schema source; `main.rhai` remains the default entrypoint.
- `node.toml` exposes stable input and output port definitions. Each port has an id, label, direction, optional schema hints, and cardinality rules.
- Legacy or simple nodes receive deterministic default ports so existing graphs can migrate without inventing per-edge decisions.
- The runtime owns host APIs so Rhai scripts cannot bypass fixture, cache, log, or scheduling policy.
- Shell delegation is allowed only through host APIs that capture command, output, exit status, and diagnostics.
- `codex/exec` uses fixture output by default and requires explicit recording mode before a live Codex response can replace a fixture.
- Node authoring docs and skill examples are part of the delivery because agents must be able to create compatible node folders.

## Risks / Trade-offs

- Rhai scripts can become hard to debug -> Persist node input, output, logs, and host API calls in the spark trace.
- Port definitions can become inconsistent across node authors -> Validate manifest ports during registry loading and surface broken-node diagnostics.
- Shell delegation can become unsafe -> Require explicit configuration, captured diagnostics, and no hidden live calls in tests.
- Cache/freezer semantics can be confused -> Define separate permanent freezer memory and input-output cache behavior.
