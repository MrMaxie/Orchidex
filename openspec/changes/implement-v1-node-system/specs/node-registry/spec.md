## MODIFIED Requirements

### Requirement: Recursive node discovery
The node registry SHALL recursively walk the node root, load every discovered `node.toml` manifest, and retain per-node diagnostics for manifests or entrypoints that cannot be loaded.

#### Scenario: Nested node folder exists
- **WHEN** a node manifest exists below the node root
- **THEN** the registry discovers and parses it during recursive loading

#### Scenario: Node manifest is invalid
- **WHEN** a node manifest fails to parse
- **THEN** the registry records that node as broken without preventing other valid nodes from loading

### Requirement: Catalog conversion
The node registry SHALL convert loaded manifests into `NodeCatalogEntry` values and expose enough metadata for runtime execution and workspace catalog rendering.

#### Scenario: Catalog is requested
- **WHEN** registry catalog entries are requested
- **THEN** each manifest is represented with id, label, description, capabilities, schema hints, and validated input/output port definitions

#### Scenario: Runtime executes a node
- **WHEN** the runtime needs to execute a graph node
- **THEN** it resolves the graph node kind through the registry and entrypoint metadata

### Requirement: Port compatibility validation
The node registry SHALL expose enough port metadata for the runtime and workspace to validate whether a graph edge connects a compatible source output port to a compatible target input port.

#### Scenario: Edge targets a missing port
- **WHEN** a graph edge references an input or output port that is not defined by the connected node kind
- **THEN** validation reports a port-specific diagnostic instead of silently accepting the edge

#### Scenario: Edge exceeds port cardinality
- **WHEN** a graph edge would exceed a port's declared connection cardinality
- **THEN** validation reports a port cardinality diagnostic for that edge
