## Context

The web package exports `OrchidexWorkspace`, resolves HTTP or Tauri connection strategies, and renders the current graph workspace. The catalog is still static in web data, and the UI only consumes the current minimal runtime event set.

## Goals / Non-Goals

**Goals:**
- Keep `web` reusable and transport-agnostic.
- Keep Tauri-specific code isolated to the IPC connection strategy.
- Make runtime state visible enough for unattended runs to remain inspectable.
- Use runtime-provided node metadata instead of static web-only catalog data.
- Treat workflows as editable graph surfaces, with activity derived from sparks and runtime events instead of workflow-owned start/stop state.
- Make the central ReactFlow canvas the primary workspace surface and move common graph controls into compact overlays.
- Support Dashboard-first navigation, project/workflow creation, workflow duplication, and per-project `cwd` metadata for runtime and Codex work.

**Non-Goals:**
- Do not move runtime decisions into React state.
- Do not introduce persisted workflow status or workflow-level start/stop semantics.
- Do not make the desktop shell use CLI or HTTP internally.
- Do not create a marketing or landing-page experience.

## Decisions

- `ConnectionStrategy` is the single UI contract and mirrors Rust transport-safe contracts.
- HTTP dev mode uses REST commands plus SSE events against `core serve`.
- Desktop mode uses Tauri IPC commands plus Tauri event forwarding against the same `core` runtime.
- The workspace renders graph editing, spark visualization, and process state from runtime events and command responses.
- Node catalog discovery comes from `core`; web can cache it locally for rendering but does not own catalog truth.
- The left explorer starts with a Dashboard item; initial navigation restores the last opened workflow when present and otherwise opens Dashboard.
- Projects are containers with metadata and a `cwd` path; workflows are graphs owned by projects.
- Canvas edges keep routing metadata in data/contracts but do not render text labels by default.
- ReactFlow controls and minimap are treated as functional UI: controls must be theme-readable, and the minimap should use about half the current visual footprint.

## Risks / Trade-offs

- Transport drift -> Add shared acceptance tests or contract fixtures for HTTP and IPC command parity.
- UI state drift from runtime -> Treat runtime events as authoritative and refetch graph/run state after reconnect.
- Dense workspace complexity -> Use established shadcn primitives, ScrollArea panes, ReactFlow, and clear diagnostics instead of decorative UI.
- Workflow/project terminology drift -> Keep project metadata, workflow graph data, and runtime spark state separate in contracts and UI copy.
- Port-aware edges can complicate migration -> Provide deterministic default input/output ports for legacy graph nodes.
