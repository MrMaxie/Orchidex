## MODIFIED Requirements

### Requirement: Runtime event consumption
The web workspace SHALL consume runtime events to update graph, spark, node process, queue, manual gate, blocked, failed, waiting, completed, and diagnostic UI state.

#### Scenario: Spark status event arrives
- **WHEN** a runtime event changes spark or node state
- **THEN** the workspace state updates the corresponding visible status

#### Scenario: Spark moves across an edge
- **WHEN** a spark movement event arrives
- **THEN** the workspace updates the spark location and edge transition without a full page refresh

#### Scenario: Workflow has no spark activity
- **WHEN** the runtime has no active, waiting, blocked, failed, or completed spark events for the selected workflow
- **THEN** the workspace shows no independent workflow running or stopped state

### Requirement: Static catalog limitation
The v1 workspace SHALL replace static mock catalog data with runtime-backed catalog discovery.

#### Scenario: User opens catalog in current baseline
- **WHEN** the current node catalog dialog is displayed
- **THEN** its source is web-side mock data rather than a runtime catalog endpoint

#### Scenario: User opens catalog in v1
- **WHEN** the v1 catalog dialog is displayed
- **THEN** its source is runtime-provided node catalog metadata
