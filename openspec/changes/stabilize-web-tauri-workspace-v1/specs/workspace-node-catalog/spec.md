## ADDED Requirements

### Requirement: Runtime-backed node catalog
The workspace SHALL load node catalog metadata from core and render node ids, labels, descriptions, capabilities, config schema hints, input schema hints, output schema hints, and broken-node diagnostics.

#### Scenario: User opens node catalog
- **WHEN** the user opens the node catalog
- **THEN** the workspace displays runtime-provided catalog entries and diagnostics

### Requirement: Catalog insertion
The workspace SHALL allow users to insert catalog nodes into the editable graph using runtime-provided node metadata.

#### Scenario: User inserts catalog node
- **WHEN** the user selects a catalog node to add
- **THEN** the workspace creates a graph node with the selected kind and editable configuration
