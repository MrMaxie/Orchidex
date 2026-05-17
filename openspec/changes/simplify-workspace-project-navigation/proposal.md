## Why

The workspace explorer currently shows separate `Automation` and `Debug` project folders, but runtime-loaded and GUI-created projects are always assigned to `automation`. This makes `Debug` appear as a meaningful project category even though debug functionality is represented by `debug/*` catalog nodes, not by a separate project space.

## What Changes

- Replace the fixed `Automation`/`Debug` project grouping in the workspace explorer with a single project list.
- Keep `debug/*` node catalog entries available and labeled as debug nodes.
- Preserve dashboard-first navigation, workflow selection, project creation, workflow creation, and last-opened workflow restoration.
- Keep Dashboard as a non-workflow route with no workflow header duplication.
- Keep workflow row actions, including duplicate, attached to the project tree instead of the main workflow header.
- Keep visible project `cwd` values absolute and node runtime identity fields read-only in the inspector.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `web-workspace-component`: Workspace project navigation will no longer expose empty or synthetic project folders when all projects share the same project category.

## Impact

- Affects the web workspace explorer, dashboard/workflow shell layout, workflow row actions, node inspector editing surface, and project metadata used for UI grouping.
- Does not change core graph/runtime contracts, node namespaces, node catalog behavior, Tauri IPC, or HTTP/SSE transport behavior.
