## Context

The workspace explorer currently receives a fixed `projectGroups` list with `Automation` and `Debug`, then filters projects by `metadata.groupId`. Core-loaded projects and GUI-created projects both use `groupId: "automation"`, so the `Debug` folder is empty unless custom state is manually injected. Debug behavior already has a clear product surface in the node catalog through `debug/*` node ids.

## Goals / Non-Goals

**Goals:**

- Make the explorer represent actual workspace structure instead of synthetic categories.
- Preserve Dashboard-first navigation and existing project/workflow actions.
- Keep debug node catalog entries distinct from project navigation.

**Non-Goals:**

- Do not change runtime graph, spark, node catalog, HTTP, or Tauri IPC contracts.
- Do not rename or remove `debug/*` nodes.
- Do not introduce persisted project grouping until there is a real product model for it.

## Decisions

- Render projects directly under the Dashboard item instead of fixed group folders. This removes the empty `Debug` branch and keeps the explorer aligned with the data the app actually owns.
- Keep `groupId` in the TypeScript contract for now. Removing it from `CoreProjectMetadata` would broaden the change into a contract cleanup that is not required to fix the confusing UI.
- Keep debug node classification in the catalog. Node namespaces and capabilities remain the right place to distinguish debug tooling from standard or Codex nodes.

## Risks / Trade-offs

- Future grouping may be needed once projects have real categories -> Reintroduce grouping later with persisted metadata and visible user controls.
- Existing code still has `groupId` in metadata -> Leave a focused follow-up for contract cleanup if grouping stays unused.
