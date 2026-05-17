## ADDED Requirements

### Requirement: In-memory runtime state
The current runtime SHALL keep graph state, spark state, and runtime epoch in memory for the lifetime of a `RuntimeHandle`.

#### Scenario: Runtime handle is created
- **WHEN** a `RuntimeHandle` is created
- **THEN** it stores the graph, an empty spark map, and an epoch counter in process memory

### Requirement: Spark ignition
The current runtime SHALL ignite a spark only at an existing graph node.

#### Scenario: Unknown node is used
- **WHEN** a spark is ignited with a node id that is not present in the current graph
- **THEN** the runtime returns a missing-node error

### Requirement: Minimal edge advancement
The current runtime SHALL advance active sparks by selecting the first outgoing edge from the current node.

#### Scenario: Outgoing edge exists
- **WHEN** an active spark is advanced and the current node has an outgoing edge
- **THEN** the spark moves to that edge target and movement events are emitted

### Requirement: Runtime limitation is explicit
The current runtime SHALL be understood as a minimal baseline that does not yet execute node-specific Rhai logic during spark advancement.

#### Scenario: Spark reaches a node kind with Rhai entrypoint
- **WHEN** a spark moves through the current runtime
- **THEN** node kind metadata does not yet cause the corresponding Rhai entrypoint to run
