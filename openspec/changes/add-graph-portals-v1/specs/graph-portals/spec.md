## ADDED Requirements

### Requirement: Portal entry
A graph portal entry SHALL allow a parent graph to start a target graph with a JSON-compatible payload and a parent trace reference.

#### Scenario: Parent graph enters target graph
- **WHEN** a spark reaches a portal entry with a valid target graph and payload
- **THEN** the runtime starts the target graph and records the parent-child trace relationship

### Requirement: Portal exit
A graph portal exit SHALL return a JSON-compatible payload from the target graph to the waiting parent graph route.

#### Scenario: Target graph exits successfully
- **WHEN** a target graph reaches its portal exit
- **THEN** the runtime resumes the parent spark with the returned payload and records the portal exit event

### Requirement: Portal validation
The runtime SHALL validate target graph id, portal id, input payload schema hints, output payload schema hints, and recursion limits before executing a portal transfer.

#### Scenario: Portal target is missing
- **WHEN** a spark reaches a portal entry whose target graph cannot be found
- **THEN** the runtime blocks the spark with a portal-specific diagnostic

### Requirement: Portal cancellation
Portal-launched child work SHALL be cancellable through parent extinguish-all and direct child cancellation, with cancellation reflected in both traces.

#### Scenario: Parent run is extinguished
- **WHEN** the user extinguishes a parent run with active portal-launched child sparks
- **THEN** the child sparks are extinguished and both parent and child traces record the cancellation

### Requirement: Portal visibility
The workspace SHALL make portal transfers visible through graph boundary markers, parent-child trace links, and portal enter/exit events.

#### Scenario: User inspects portal-launched work
- **WHEN** the user opens a spark trace that crossed a portal
- **THEN** the workspace shows the source graph, target graph, entry portal, exit portal, and returned payload summary
