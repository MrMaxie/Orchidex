## Context

The baseline runtime has the correct boundaries but only minimal behavior. `RuntimeHandle` stores a graph and sparks in memory, emits events, advances active sparks through the first outgoing edge, and blocks sparks when their current node disappears after a live edit. The node registry and Rhai execution helpers exist but are not part of the spark advancement path.

## Goals / Non-Goals

**Goals:**
- Make `core` the authoritative v1 spark runner.
- Execute node logic through a runtime-owned node execution layer.
- Preserve multi-spark operation while allowing a single extinguish-all operation.
- Support live graph edits without crashing or losing traceability.
- Persist enough local state to inspect unattended runs, queues, failures, and decisions.
- Keep workflow activity derived from runtime-owned spark state; workflows themselves do not own start, stop, or running state.

**Non-Goals:**
- Do not add distributed execution or a remote database.
- Do not make the web layer own runtime decisions.
- Do not add a workflow-level execution state machine separate from sparks.
- Do not invoke live Codex during automated tests or acceptance scenarios.

## Decisions

- Runtime state has two tiers: in-process state for active execution and local file-backed records for graph definitions, spark traces, run history, queues, cache/freezer metadata, and diagnostics.
- Runtime state is spark-centric: active work is represented by spark ids, statuses, locations, traces, queues, waits, blocks, completions, and extinguish events.
- Node execution returns a structured outcome: continue to one or more edges, wait, block, fail, complete, or emit logs. This avoids encoding control flow only in edge traversal.
- Graph edits are accepted live, then reconciled against active sparks. Affected sparks become blocked or waiting with explicit reasons instead of being silently dropped.
- Runtime events remain transport-safe JSON and are delivered through both SSE and Tauri event channels.
- Tests use fixtures and deterministic clocks or simulated timers where possible.

## Risks / Trade-offs

- More runtime states can complicate UI rendering -> Define a small state machine and make every transition event-driven.
- Workflow state duplication can confuse UI behavior -> Expose spark summaries and events instead of workflow start/stop state.
- File-backed persistence can drift from in-memory state -> Write through a runtime store abstraction and test replay after restart.
- Live edits during execution can create ambiguous routing -> Block affected sparks with user-readable diagnostics.
- Long-running node work can hide progress -> Emit node status, spark trace, and log events throughout execution.

## Migration Plan

- Keep existing public commands working while adding the new runtime semantics.
- Add new commands and events in Rust first, then mirror transport-safe TypeScript types.
- Use the existing `clients-project` fixture as the canonical acceptance scenario.
