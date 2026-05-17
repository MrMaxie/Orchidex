## ADDED Requirements

### Requirement: Live graph editing
The workspace SHALL allow graph edits while sparks are active and SHALL show runtime reconciliation results for blocked or waiting sparks.

#### Scenario: User removes active route
- **WHEN** the user edits the graph in a way that invalidates an active spark route
- **THEN** the workspace shows the runtime diagnostic for the affected spark

### Requirement: Manual and queue controls
The workspace SHALL expose controls for manual ignite, manual accept/reject, queue release, queue lock state, and extinguish-all when those operations are available.

#### Scenario: User releases queued spark
- **WHEN** the user releases a queued spark through the workspace
- **THEN** the runtime resumes the spark and the workspace updates from emitted events

### Requirement: Edge text stays hidden on the canvas
The workspace SHALL NOT render text labels directly on graph edges by default, even when edge metadata includes labels or routing names.

#### Scenario: Edge has routing metadata
- **WHEN** the graph contains an edge with label or routing metadata
- **THEN** the canvas renders the edge path without visible edge text and keeps the metadata available for inspectors, routing, or diagnostics

### Requirement: Edge activity styles
The workspace SHALL visually distinguish normal edges from edges currently carrying a spark transition.

#### Scenario: Spark crosses an edge
- **WHEN** the runtime emits a spark movement event with an edge id
- **THEN** the matching edge uses the active transition style and other edges remain in the normal style

### Requirement: Edge attach and detach
The workspace SHALL allow users to detach, reconnect, and delete graph edges through the GUI while preserving runtime reconciliation feedback for active sparks.

#### Scenario: User reconnects an edge
- **WHEN** the user detaches an edge endpoint and reconnects it to another compatible port
- **THEN** the graph update records the new source or target port endpoint and the runtime reconciles any affected active sparks

### Requirement: Port-aware edge editing
The workspace SHALL create and edit graph edges using explicit source output ports and target input ports.

#### Scenario: User connects two node handles
- **WHEN** the user connects a source handle to a target handle
- **THEN** the saved edge identifies source node id, source output port id, target node id, and target input port id
