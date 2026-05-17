## ADDED Requirements

### Requirement: Clients project fixture assets
The current repository SHALL provide a `clients-project` fixture folder with a graph, mock input, and frozen Codex response files.

#### Scenario: Fixture folder is inspected
- **WHEN** a developer inspects `examples/fixtures/clients-project/`
- **THEN** the folder contains graph, input mail, and frozen Codex output fixtures

### Requirement: Scenario command uses fixtures
The current core CLI SHALL include a scenario command that runs the `clients-project` fixture path without invoking live Codex.

#### Scenario: Fixture scenario is run
- **WHEN** a developer runs the scenario command
- **THEN** the runtime loads the fixture graph or falls back to the default graph and reports fixture-backed Codex output

### Requirement: Fixture-first Codex convention
Codex-backed node behavior SHALL use fixture files by default for acceptance scenarios and tests.

#### Scenario: Acceptance scenario reaches Codex node
- **WHEN** an acceptance scenario includes Codex work
- **THEN** expected Codex output is represented by frozen fixture data rather than repeated live Codex API calls
