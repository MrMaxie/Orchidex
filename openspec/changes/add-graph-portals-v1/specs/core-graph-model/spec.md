## MODIFIED Requirements

### Requirement: Serializable graph contracts
The Rust core SHALL define serializable contracts for graphs, graph nodes, graph edges, node positions, JSON-compatible payloads, spark state, node state, and portal metadata for cross-graph entry and exit points.

#### Scenario: Transport serializes graph state
- **WHEN** graph state crosses HTTP or IPC boundaries
- **THEN** it uses the Rust core graph, node, edge, payload, spark, and status shapes

#### Scenario: Portal metadata is serialized
- **WHEN** a graph includes portal entry or exit definitions
- **THEN** those definitions are represented in the transport-safe graph contract

### Requirement: Graph nodes carry node kind and config
Each graph node SHALL carry an id, node kind, label, position, JSON-compatible configuration value, and any portal-related configuration required by its node kind.

#### Scenario: Node is rendered by the workspace
- **WHEN** a graph node is sent to the web workspace
- **THEN** the workspace has enough node id, kind, label, position, and config data to render it
