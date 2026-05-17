## Why

Large prepared workflows need graph composition. v1 should allow one graph to start another graph and receive results back through explicit portal nodes, while preserving traceability and user control.

## What Changes

- Add full v1 graph portal requirements for portal entry, portal exit, cross-graph spark transfer, return payloads, cancellation, and trace visibility.
- Define portal behavior as runtime-owned, transport-safe, and visible in the workspace.
- Add portal acceptance scenarios to validate graph-to-graph flow instead of treating portals as future work.

## Capabilities

### New Capabilities
- `graph-portals`: Cross-graph portal entry, exit, trace, cancellation, and UI visibility behavior.

### Modified Capabilities
- `core-graph-model`: Extend graph contracts with portal metadata.
- `core-spark-runtime`: Extend spark routing with cross-graph parent-child execution.
- `core-runtime-events`: Add portal enter, exit, return, block, and cancellation events.
- `web-runtime-visualization`: Show portal crossings and parent-child traces in the workspace.
- `fixture-clients-project`: Add portal acceptance fixtures when the prepared flow spans graphs.

## Impact

- Affects graph model contracts, runtime routing, event payloads, workspace visualization, acceptance fixtures, and node catalog entries for portal-capable graphs.
- Requires future tests for portal handoff, portal return, cancellation, blocked portal resolution, and trace inspection.
