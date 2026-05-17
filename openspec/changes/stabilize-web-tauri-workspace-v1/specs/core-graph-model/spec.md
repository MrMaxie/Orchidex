## MODIFIED Requirements

### Requirement: Transport-safe graph contracts
The Rust core SHALL define serializable contracts for graphs, graph nodes, graph edges, node positions, JSON-compatible payloads, spark state, node state, and port-aware edge endpoints.

#### Scenario: Transport serializes graph state
- **WHEN** graph state crosses HTTP or IPC boundaries
- **THEN** it uses Rust core graph, node, edge, port endpoint, payload, spark, and status shapes

### Requirement: Port-aware graph edges
Each graph edge SHALL identify source node id, source output port id, target node id, and target input port id, while allowing optional routing metadata that is not rendered as canvas edge text by default.

#### Scenario: Edge is persisted
- **WHEN** a graph edge is saved or sent through a transport
- **THEN** the edge includes stable source and target port endpoint ids in addition to source and target node ids

#### Scenario: Legacy edge is loaded
- **WHEN** an older graph edge lacks explicit source or target port ids
- **THEN** the runtime or workspace maps it to deterministic default ports for the source and target node kinds
