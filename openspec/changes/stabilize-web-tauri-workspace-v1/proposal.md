## Why

The current workspace already separates UI from transport, but v1 needs this boundary to be stable enough for real graph editing, node catalog discovery, live spark visualization, and desktop acceleration through Tauri IPC.

## What Changes

- Stabilize `OrchidexWorkspace` as the reusable GUI component for both web development and Tauri desktop.
- Extend typed connection contracts for graph editing, node catalog discovery, queue/manual controls, run history, and runtime events.
- Require HTTP/SSE and Tauri IPC strategies to preserve behavior parity while using different transports.
- Add v1 UI requirements for live spark location, edge transitions, node process state, blocked/waiting diagnostics, and editable graphs.

## Capabilities

### New Capabilities
- `workspace-experience`: v1 GUI behavior for reusable workspace, live graph editing, node catalog, and runtime visualization.
- `workspace-node-catalog`: Runtime-backed node catalog discovery and rendering in the workspace.
- `workspace-graph-editing`: Live graph editing behavior and reconciliation feedback.

### Modified Capabilities
- `web-workspace-component`: Stabilize the reusable workspace component contract.
- `web-connection-strategies`: Extend the connection strategy for v1 runtime commands and events.
- `web-runtime-visualization`: Extend visualization from baseline state rendering to full v1 spark and process visualization.
- `core-http-sse-transport`: Extend HTTP/SSE dev transport for v1 workspace needs.
- `tauri-desktop-shell`: Preserve direct core ownership in desktop mode.
- `tauri-ipc-transport`: Extend IPC parity with the v1 runtime command surface.

## Impact

- Affects `web/src/features/workspace/`, `web/src/features/workspace/contracts.ts`, HTTP and Tauri connection strategies, Tauri IPC commands, and runtime event contracts.
- UI implementation later must be verified in a live browser or Tauri window.
