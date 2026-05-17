## ADDED Requirements

### Requirement: Folder-based node definitions
The current node catalog SHALL represent each node as a folder containing `node.toml` and `main.rhai`.

#### Scenario: Node catalog is inspected
- **WHEN** a developer inspects `nodes/`
- **THEN** each node definition is stored in a namespace folder with a manifest and Rhai entrypoint

### Requirement: Node manifests provide metadata and schemas
Node manifests SHALL provide an id, label, description, entrypoint, capabilities, and optional JSON-compatible schema hints.

#### Scenario: Node registry loads manifests
- **WHEN** the node registry loads the `nodes/` directory
- **THEN** it can produce catalog entries from node manifests

### Requirement: Rhai entrypoints are JSON-compatible placeholders
The current Rhai entrypoints SHALL receive a JSON-compatible `payload` value and return a JSON-compatible output value or unit.

#### Scenario: Basic Rhai transform executes
- **WHEN** a Rhai entrypoint mutates and returns the payload
- **THEN** the helper converts the result back into JSON-compatible data

### Requirement: Standard and debug v1 candidate nodes exist as catalog entries
The current repository SHALL include catalog folders for the planned standard, debug, and Codex node ids.

#### Scenario: Catalog test checks representative nodes
- **WHEN** the node registry test loads the catalog
- **THEN** it can find representative nodes such as `std/manual-ignite` and `codex/exec`
