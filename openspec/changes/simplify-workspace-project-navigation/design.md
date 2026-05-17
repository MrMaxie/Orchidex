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
- Treat Dashboard as a workspace-level route, not as a workflow. `workspace-shell.tsx` should only render the workflow header and workflow actions when `activeWorkflow` exists.
- Keep explorer level ownership explicit: `project-tree.tsx` owns Dashboard and project rows, while `project-tree-file.tsx` owns workflow rows and row-level actions such as duplicate.
- Make workflow duplication target a `workflowId`; tree actions should duplicate the clicked workflow instead of relying on whichever workflow is currently active.
- Keep project `cwd` defaults absolute, preferably through a shared web default derived from the Vite workspace root.
- Treat node `app` and `connector` as runtime identity fields. Display them as read-only node type details in the inspector instead of editable inputs.
- Keep default labels and actions aligned across `data/mock-projects.ts`, `config/status-meta.tsx`, and rendered components. The fixture project is a visible product surface.
- Style ReactFlow toolbox/controls through ReactFlow `Panel`, `Controls`, and nested selectors because those controls are partly owned by `@xyflow/react`.
- During web-only validation, connection failures to `127.0.0.1:3869` are expected when the core HTTP/SSE server is not running.

## Risks / Trade-offs

- Future grouping may be needed once projects have real categories -> Reintroduce grouping later with persisted metadata and visible user controls.
- Existing code still has `groupId` in metadata -> Leave a focused follow-up for contract cleanup if grouping stays unused.
