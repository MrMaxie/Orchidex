## MODIFIED Requirements

### Requirement: In-memory runtime state
The v1 runtime SHALL keep authoritative in-process state for active execution and SHALL coordinate that state with local file-backed records for graph definitions, active sparks, queues, run history, diagnostics, and replay metadata.

#### Scenario: Runtime handle is created
- **WHEN** a `RuntimeHandle` is created
- **THEN** it stores the graph, an empty spark map, and an epoch counter in process memory

#### Scenario: Runtime state changes during execution
- **WHEN** a spark changes status, location, queue state, or diagnostic state
- **THEN** the runtime updates in-process state and records the change through the v1 persistence layer

### Requirement: Spark ignition
The v1 runtime SHALL ignite sparks at valid graph nodes, valid graph portal entries, or runtime-supported scheduled entrypoints, and SHALL reject unknown entrypoints with deterministic errors.

#### Scenario: Unknown node is used
- **WHEN** a spark is ignited with a node id that is not present in the current graph
- **THEN** the runtime returns a missing-node error

#### Scenario: Valid node is used
- **WHEN** a spark is ignited at a valid node
- **THEN** the runtime creates the spark, records the trace start, emits ignition and node-status events, and starts node execution

### Requirement: Minimal edge advancement
The v1 runtime SHALL replace first-edge-only movement with node execution outcomes that can route to one or more valid outgoing edges, wait, block, fail, complete, or emit diagnostics.

#### Scenario: Outgoing edge exists
- **WHEN** an active spark is advanced and the current node has an outgoing edge
- **THEN** the spark moves to that edge target and movement events are emitted

#### Scenario: Node selects route
- **WHEN** a node execution outcome selects a valid outgoing route
- **THEN** the runtime updates the spark payload, moves it to the selected target, emits movement events, and records the trace step

### Requirement: Runtime limitation is explicit
The v1 runtime SHALL execute node-specific logic through the node execution layer instead of treating node kind metadata as decorative catalog information.

#### Scenario: Spark reaches a node kind with Rhai entrypoint
- **WHEN** a spark moves through the v1 runtime
- **THEN** the runtime resolves the node kind through the registry and executes the corresponding Rhai entrypoint

#### Scenario: Spark reaches a v1 executable node
- **WHEN** a spark reaches a node whose manifest and entrypoint are valid
- **THEN** the runtime invokes the node execution layer and applies the returned node outcome

## ADDED Requirements

### Requirement: Spark-derived workflow activity
The v1 runtime SHALL represent active work through spark state and SHALL NOT require a separate workflow-level start, stop, running, or stopped state.

#### Scenario: No sparks are active
- **WHEN** a graph has no active, waiting, blocked, or queued sparks
- **THEN** the runtime reports no active work for that graph without mutating workflow-level status

#### Scenario: Sparks are active
- **WHEN** one or more sparks are active, waiting, queued, blocked, failed, completed, or extinguished
- **THEN** clients derive workflow activity from the spark summaries and emitted runtime events

#### Scenario: Runtime snapshot is persisted
- **WHEN** the runtime serializes its local snapshot for persistence
- **THEN** the snapshot contains spark summaries, run history, and trace records without a workflow-level status, state, started, stopped, or running field

### Requirement: Concurrent spark execution
The runtime SHALL support multiple active sparks at once while preserving independent spark ids, payloads, statuses, locations, and traces.

#### Scenario: Multiple sparks are active
- **WHEN** two sparks run through the same graph at the same time
- **THEN** each spark advances independently and keeps its own trace order

### Requirement: Extinguish-all cancellation
The runtime SHALL provide an extinguish-all operation that cancels active and waiting sparks and prevents their pending node outcomes from being applied.

#### Scenario: Extinguish-all is requested
- **WHEN** the user extinguishes all sparks
- **THEN** active and waiting sparks become extinguished, cancellation is recorded, and later outcomes for those sparks are ignored

### Requirement: Live graph edit reconciliation
The runtime SHALL reconcile live graph edits against active sparks and block affected sparks with specific diagnostics.

#### Scenario: Active route is removed
- **WHEN** a live graph edit removes a route selected by an active spark
- **THEN** the runtime blocks that spark and records the missing route diagnostic
