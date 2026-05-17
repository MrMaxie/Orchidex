# standard-node-placeholders Specification

## Purpose
Describe the current inventory and placeholder behavior of planned standard, debug, and Codex nodes.
## Requirements
### Requirement: Current node inventory
The repository SHALL include current manifest and Rhai entrypoint folders for planned standard, debug, and Codex node ids.

#### Scenario: Node folders are inspected
- **WHEN** a developer inspects `nodes/`
- **THEN** the repository includes standard nodes, debug nodes, and `codex/exec`

### Requirement: Placeholder behavior
Current node entrypoints SHALL be understood as placeholder Rhai implementations until v1 node behavior is implemented.

#### Scenario: Standard node entrypoint is opened
- **WHEN** a current standard node `main.rhai` is inspected
- **THEN** it contains a simple placeholder payload, scheduling, cache, or freezer expression

### Requirement: Codex node placeholder
The current `codex/exec` node SHALL be represented as a fixture-first placeholder, not a live Codex runner.

#### Scenario: Codex node entrypoint is inspected
- **WHEN** `nodes/codex/exec/main.rhai` is inspected
- **THEN** it marks the payload as fixture-backed instead of invoking live Codex
