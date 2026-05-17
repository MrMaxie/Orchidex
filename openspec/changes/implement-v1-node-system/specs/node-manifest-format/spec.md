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

### Requirement: Node id convention
Node ids SHALL match their namespace path convention, such as `nodes/std/manual-ignite` using `std/manual-ignite`, and v1 validation SHALL report mismatches as broken catalog entries.

#### Scenario: Agent creates a node folder
- **WHEN** a new node is authored
- **THEN** its manifest id follows the namespace/name folder convention
