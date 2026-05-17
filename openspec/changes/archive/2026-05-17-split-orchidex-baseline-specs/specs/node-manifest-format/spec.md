## ADDED Requirements

### Requirement: Manifest required fields
Each node manifest SHALL contain `id`, `label`, `description`, and `entrypoint` fields.

#### Scenario: Manifest is parsed
- **WHEN** the node registry reads a `node.toml`
- **THEN** it expects the required node metadata fields to be present

### Requirement: Manifest schema hints
Node manifests SHALL support optional `capabilities`, `config_schema`, `input_schema`, and `output_schema` fields.

#### Scenario: Catalog entry is generated
- **WHEN** a manifest includes schema hints
- **THEN** those hints are included in the generated node catalog entry

### Requirement: Node id convention
Node ids SHALL match their namespace path convention, such as `nodes/std/manual-ignite` using `std/manual-ignite`.

#### Scenario: Agent creates a node folder
- **WHEN** a new node is authored
- **THEN** its manifest id follows the namespace/name folder convention
