## ADDED Requirements

### Requirement: Graph and spark contracts
The Rust core SHALL define graph, node, edge, spark, payload, node status, spark status, and runtime event contracts as serializable data structures.

#### Scenario: Runtime contracts are shared through transports
- **WHEN** the web or Tauri layer requests graph or spark data
- **THEN** the runtime exchanges serializable graph, spark, status, payload, and event objects

### Requirement: Minimal in-memory spark runtime
The current runtime SHALL keep graph and spark state in memory and move active sparks through graph edges using the runtime advancement loop.

#### Scenario: Spark is ignited
- **WHEN** a spark is ignited at an existing node
- **THEN** the runtime stores the spark, emits an ignition event, marks the node running, and starts advancing the spark asynchronously

### Requirement: Extinguish active sparks
The current runtime SHALL expose an operation that marks all active sparks as extinguished and emits extinguish events.

#### Scenario: Active sparks are extinguished
- **WHEN** the extinguish operation runs
- **THEN** active sparks are marked extinguished, individual extinguish events are emitted, and an all-sparks-extinguished event is emitted

### Requirement: Live graph replacement blocks invalid current nodes
The current runtime SHALL allow graph replacement while sparks exist and block active sparks whose current node is removed.

#### Scenario: Current node is removed by live edit
- **WHEN** a graph replacement removes the node where an active spark is located
- **THEN** the spark is marked blocked and a blocked event is emitted

### Requirement: HTTP and SSE development transport
The current core server SHALL expose HTTP commands for graph and spark operations and SSE events for runtime updates.

#### Scenario: Web development client connects to core
- **WHEN** the web development strategy connects to the core server
- **THEN** it can fetch and replace the graph, ignite sparks, extinguish sparks, and subscribe to runtime events

### Requirement: Tauri IPC desktop transport
The current desktop shell SHALL expose graph and spark operations through Tauri IPC and forward runtime events through a Tauri event channel.

#### Scenario: Desktop client uses IPC
- **WHEN** the workspace runs inside Tauri
- **THEN** it uses IPC commands for graph and spark operations and receives runtime events from the Tauri event listener
