# core-runtime-events Specification

## Purpose
Describe the current runtime event enum and broadcast channel responsibilities in the Rust core.
## Requirements
### Requirement: Runtime event enum
The Rust core SHALL define runtime events for graph updates, spark ignition, spark movement, node status changes, spark blocking, spark extinguishing, all-sparks extinguishing, and logs.

#### Scenario: Spark moves
- **WHEN** a spark moves from one node to another
- **THEN** the runtime emits a movement event containing spark id, source node id, target node id, and edge id

### Requirement: Broadcast event channel
The current runtime SHALL publish runtime events through an internal broadcast channel that HTTP/SSE and Tauri listeners can subscribe to.

#### Scenario: Client subscribes to runtime events
- **WHEN** a transport subscribes to the runtime
- **THEN** it receives events emitted after subscription through the broadcast receiver
