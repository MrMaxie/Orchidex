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
- **THEN** each manifest is represented with id, label, description, capabilities, and schema hints

#### Scenario: Runtime executes a node
- **WHEN** the runtime needs to execute a graph node
- **THEN** it resolves the graph node kind through the registry and entrypoint metadata
