## ADDED Requirements

### Requirement: Runtime-backed node catalog
The workspace SHALL load node catalog metadata from the core runtime instead of relying on a static web-only catalog.

#### Scenario: User opens the node catalog
- **WHEN** the user opens the node catalog
- **THEN** the workspace displays runtime-provided node ids, labels, descriptions, capabilities, and schema hints

### Requirement: Live spark visualization
The workspace SHALL show active spark locations, edge transitions, node process states, waiting states, blocked states, failures, and completed work from runtime events.

#### Scenario: Spark moves across an edge
- **WHEN** the runtime emits a spark movement event
- **THEN** the workspace visually updates the spark location and edge transition without requiring a full page refresh

### Requirement: Workflow activity comes from sparks
The workspace SHALL treat a workflow as an editable graph surface and SHALL derive visible workflow activity only from active, waiting, blocked, failed, completed, or extinguished sparks reported by the runtime.

#### Scenario: User opens an idle workflow
- **WHEN** the selected workflow has no active or waiting sparks
- **THEN** the workspace shows the workflow as an editable graph without workflow-level running, stopped, start, or stop state

#### Scenario: Spark activity changes
- **WHEN** runtime events report spark ignition, movement, waiting, blocking, completion, or extinguishing
- **THEN** the workspace updates workflow activity indicators from those spark states instead of mutating a workflow-owned status field

### Requirement: Live graph editing
The workspace SHALL allow graph edits while sparks are active and SHALL surface runtime reconciliation results for affected sparks.

#### Scenario: User removes an active route
- **WHEN** the user edits the graph in a way that invalidates an active spark route
- **THEN** the workspace shows the runtime blocked diagnostic for that spark

### Requirement: Manual and queue controls
The workspace SHALL provide controls for manual spark ignition, manual acceptance, queue release, queue lock state, and extinguish-all where supported by the selected graph and node configuration.

#### Scenario: User releases a queued spark
- **WHEN** a queued spark is released through the workspace
- **THEN** the runtime resumes that spark and the workspace updates from the emitted events

### Requirement: Canvas-first workspace layout
The workspace SHALL render the central column as the primary ReactFlow canvas surface and SHALL avoid nested panels inside that central canvas area.

#### Scenario: User views a workflow
- **WHEN** a workflow is selected
- **THEN** the middle workspace area is occupied by the flow canvas, with add-node, mode, zoom, fit-view, and selection controls available as compact hover or overlay controls

### Requirement: Theme-readable visual controls
ReactFlow controls, selected states, status indicators, and canvas overlays SHALL use the workspace design tokens so functional controls remain readable and the workspace does not collapse to a black-and-white visual treatment.

#### Scenario: User opens canvas controls
- **WHEN** zoom, fit-view, minimap, selection, or status controls are visible
- **THEN** icons, backgrounds, borders, and active states have sufficient theme contrast and use the configured status and workflow color tokens

### Requirement: Compact minimap
The workspace minimap SHALL remain available but SHALL render at roughly half the current visual footprint so it does not dominate the canvas.

#### Scenario: User opens a workflow with the minimap enabled
- **WHEN** the canvas renders its minimap
- **THEN** the minimap occupies a compact corner footprint while staying pannable or zoomable where supported
