## ADDED Requirements

### Requirement: Workspace state hook
The current web workspace SHALL maintain graph, spark, node status, and event-driven UI state through workspace state hooks and components.

#### Scenario: Graph is loaded
- **WHEN** the workspace connection returns a graph
- **THEN** the workspace stores and renders the graph in the UI

### Requirement: Runtime event consumption
The current web workspace SHALL consume runtime events to update visible graph and spark state.

#### Scenario: Spark status event arrives
- **WHEN** a runtime event changes spark or node state
- **THEN** the workspace state updates the corresponding visible status

### Requirement: Static catalog limitation
The current web workspace SHALL be understood to use static mock catalog data for catalog display until runtime catalog discovery is implemented.

#### Scenario: User opens catalog in current baseline
- **WHEN** the current node catalog dialog is displayed
- **THEN** its source is web-side mock data rather than a runtime catalog endpoint
