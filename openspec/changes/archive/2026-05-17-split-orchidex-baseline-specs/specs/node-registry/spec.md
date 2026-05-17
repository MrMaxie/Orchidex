## ADDED Requirements

### Requirement: Recursive node discovery
The current node registry SHALL recursively walk the node root and load every discovered `node.toml` manifest.

#### Scenario: Nested node folder exists
- **WHEN** a node manifest exists below the node root
- **THEN** the registry discovers and parses it during recursive loading

### Requirement: Missing node root tolerance
The current node registry SHALL return an empty registry when the configured node root does not exist.

#### Scenario: Node root is missing
- **WHEN** `NodeRegistry::load_from` receives a path that does not exist
- **THEN** it returns an empty registry rather than failing

### Requirement: Catalog conversion
The current node registry SHALL convert loaded manifests into `NodeCatalogEntry` values.

#### Scenario: Catalog is requested
- **WHEN** registry catalog entries are requested
- **THEN** each manifest is represented with id, label, description, capabilities, and schema hints
