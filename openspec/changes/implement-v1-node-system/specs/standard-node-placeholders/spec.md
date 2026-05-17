## MODIFIED Requirements

### Requirement: Placeholder behavior
Current node entrypoints SHALL be replaced or extended so planned v1 standard, debug, and Codex nodes perform their specified behavior instead of simple placeholder payload expressions.

#### Scenario: Standard node entrypoint is opened
- **WHEN** a current standard node `main.rhai` is inspected
- **THEN** it contains a simple placeholder payload, scheduling, cache, or freezer expression

#### Scenario: Standard node runs in v1
- **WHEN** a v1 standard node receives a spark
- **THEN** it performs the behavior defined by its node-specific capability spec

### Requirement: Codex node placeholder
The current `codex/exec` node SHALL evolve from a fixture marker into a fixture-first Codex execution node that can build prompts, select model and reasoning effort, and return fixture or recorded output.

#### Scenario: Codex node entrypoint is inspected
- **WHEN** `nodes/codex/exec/main.rhai` is inspected
- **THEN** it marks the payload as fixture-backed instead of invoking live Codex
