## Context

`NodeRegistry` can load `node.toml` manifests and `execute_rhai_entrypoint` can run simple Rhai scripts, but v1 node behavior is not yet enforced by the runtime. Existing `main.rhai` files are placeholders and most host APIs are stubs.

## Goals / Non-Goals

**Goals:**
- Make folder-based nodes executable runtime units.
- Keep node payloads JSON-compatible.
- Provide host APIs for logs, shell delegation, cache, freezer, scheduling, and Codex fixtures.
- Make all v1 node ids available and testable.

**Non-Goals:**
- Do not require every node to call external tools.
- Do not allow tests to repeatedly invoke live Codex.
- Do not replace Rhai with another node language for v1.

## Decisions

- `node.toml` remains the metadata and schema source; `main.rhai` remains the default entrypoint.
- The runtime owns host APIs so Rhai scripts cannot bypass fixture, cache, log, or scheduling policy.
- Shell delegation is allowed only through host APIs that capture command, output, exit status, and diagnostics.
- `codex/exec` uses fixture output by default and requires explicit recording mode before a live Codex response can replace a fixture.
- Node authoring docs and skill examples are part of the delivery because agents must be able to create compatible node folders.

## Risks / Trade-offs

- Rhai scripts can become hard to debug -> Persist node input, output, logs, and host API calls in the spark trace.
- Shell delegation can become unsafe -> Require explicit configuration, captured diagnostics, and no hidden live calls in tests.
- Cache/freezer semantics can be confused -> Define separate permanent freezer memory and input-output cache behavior.
