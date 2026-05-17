## Context

Orchidex is an early spark-driven graph runtime and workspace. The repository already contains:

- `core/`: Rust graph models, in-memory runtime, Rhai node registry helpers, CLI, and Axum HTTP/SSE server.
- `web/`: React and TypeScript workspace UI exporting `OrchidexWorkspace` and using a typed `ConnectionStrategy`.
- `tauri/`: Tauri v2 desktop shell embedding `web` and calling `core` directly through IPC.
- `nodes/`: folder-based node definitions with `node.toml` and `main.rhai`.
- `examples/fixtures/clients-project/`: a mock graph, mail input, and frozen Codex outputs.

OpenSpec currently has no specs. This change creates a baseline that records observed behavior only, so later v1 changes can be explicit deltas.

## Goals / Non-Goals

**Goals:**
- Archive a current-state OpenSpec baseline.
- Keep the baseline factual and limited to behavior already present in the repo.
- Separate current minimal behavior from planned v1 behavior.

**Non-Goals:**
- Do not implement v1 runtime semantics.
- Do not add product code, endpoints, node behavior, UI behavior, dependencies, or tests.
- Do not describe missing v1 behavior as already implemented.

## Decisions

- Baseline specs are split by capability instead of file path: `architecture`, `runtime-contracts`, `node-catalog`, and `acceptance-fixtures`.
- The baseline is archived after validation because it documents completed current state rather than unfinished future work.
- Runtime limitations are described directly where they matter, especially the minimal spark advancement loop and placeholder node execution.

## Risks / Trade-offs

- Baseline drift -> Later implementation changes must update specs through new OpenSpec changes and archive/sync workflows.
- Overstating current behavior -> Specs use "current" language and avoid v1 claims that are not already implemented.
- Empty task list ambiguity -> Tasks are marked complete because the only implementation work is creating and validating the baseline artifacts.
