# core-graph-model Specification

## Purpose
Describe the current Rust-owned graph, node, edge, payload, spark, and status data contracts.
## Requirements
### Requirement: Serializable graph contracts
The Rust core SHALL define serializable contracts for graphs, graph nodes, graph edges, node positions, JSON-compatible payloads, spark state, and node state.

#### Scenario: Transport serializes graph state
- **WHEN** graph state crosses HTTP or IPC boundaries
- **THEN** it uses the Rust core graph, node, edge, payload, spark, and status shapes

### Requirement: Graph nodes carry node kind and config
Each graph node SHALL carry an id, node kind, label, position, and JSON-compatible configuration value.

#### Scenario: Node is rendered by the workspace
- **WHEN** a graph node is sent to the web workspace
- **THEN** the workspace has enough node id, kind, label, position, and config data to render it

### Requirement: Graph edges connect node ids
Each graph edge SHALL carry an id, source node id, target node id, and optional label.

#### Scenario: Runtime advances over an edge
- **WHEN** the current runtime selects an outgoing edge
- **THEN** it uses the edge source and target node ids to move the spark
