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
