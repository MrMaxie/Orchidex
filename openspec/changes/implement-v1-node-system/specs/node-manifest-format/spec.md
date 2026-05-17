## MODIFIED Requirements

### Requirement: Manifest required fields
Each node manifest SHALL contain `id`, `label`, `description`, and `entrypoint` fields, and v1 runtime loading SHALL reject executable nodes whose required fields are missing or inconsistent.

#### Scenario: Manifest is parsed
- **WHEN** the node registry reads a `node.toml`
- **THEN** it expects the required node metadata fields to be present

#### Scenario: Required field is missing
- **WHEN** an executable node manifest lacks a required field
- **THEN** the registry reports a node-specific manifest diagnostic

### Requirement: Manifest schema hints
Node manifests SHALL support optional `capabilities`, `config_schema`, `input_schema`, and `output_schema` fields, and v1 clients SHALL use those hints for configuration forms, manual input forms, and validation messaging.

#### Scenario: Catalog entry is generated
- **WHEN** a manifest includes schema hints
- **THEN** those hints are included in the generated node catalog entry

### Requirement: Manifest port definitions
Node manifests SHALL support stable input and output port definitions, where each port includes an id, label, direction, optional schema hints, and connection cardinality.

#### Scenario: Manifest declares ports
- **WHEN** a manifest includes input or output port definitions
- **THEN** the registry validates the port ids, directions, schema hints, and cardinality before exposing the node as executable

#### Scenario: Manifest omits ports
- **WHEN** a legacy or simple node manifest omits explicit port definitions
- **THEN** the registry assigns deterministic default input and output ports for graph editing and runtime routing

### Requirement: Node id convention
Node ids SHALL match their namespace path convention, such as `nodes/std/manual-ignite` using `std/manual-ignite`, and v1 validation SHALL report mismatches as broken catalog entries.

#### Scenario: Agent creates a node folder
- **WHEN** a new node is authored
- **THEN** its manifest id follows the namespace/name folder convention
