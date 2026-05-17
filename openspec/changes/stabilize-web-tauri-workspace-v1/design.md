## Context

The web package exports `OrchidexWorkspace`, resolves HTTP or Tauri connection strategies, and renders the current graph workspace. The catalog is still static in web data, and the UI only consumes the current minimal runtime event set.

## Goals / Non-Goals

**Goals:**
- Keep `web` reusable and transport-agnostic.
- Keep Tauri-specific code isolated to the IPC connection strategy.
- Make runtime state visible enough for unattended runs to remain inspectable.
- Use runtime-provided node metadata instead of static web-only catalog data.

**Non-Goals:**
- Do not move runtime decisions into React state.
- Do not make the desktop shell use CLI or HTTP internally.
- Do not create a marketing or landing-page experience.

## Decisions

- `ConnectionStrategy` is the single UI contract and mirrors Rust transport-safe contracts.
- HTTP dev mode uses REST commands plus SSE events against `core serve`.
- Desktop mode uses Tauri IPC commands plus Tauri event forwarding against the same `core` runtime.
- The workspace renders graph editing, spark visualization, and process state from runtime events and command responses.
- Node catalog discovery comes from `core`; web can cache it locally for rendering but does not own catalog truth.

## Risks / Trade-offs

- Transport drift -> Add shared acceptance tests or contract fixtures for HTTP and IPC command parity.
- UI state drift from runtime -> Treat runtime events as authoritative and refetch graph/run state after reconnect.
- Dense workspace complexity -> Use established shadcn primitives, ScrollArea panes, ReactFlow, and clear diagnostics instead of decorative UI.
