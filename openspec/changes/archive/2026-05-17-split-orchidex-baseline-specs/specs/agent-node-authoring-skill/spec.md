## ADDED Requirements

### Requirement: Repo-local node authoring skill
The repository SHALL provide a repo-local Orchidex node authoring skill for creating, reviewing, and updating node folders.

#### Scenario: Agent works on node folders
- **WHEN** an agent creates or updates `nodes/**`
- **THEN** it uses the repo-local node authoring guidance

### Requirement: Node authoring workflow
The node authoring skill SHALL document folder shape, manifest requirements, Rhai entrypoint payload shape, host API examples, shell delegation, and fixture-first Codex guidance.

#### Scenario: Agent needs shell delegation example
- **WHEN** an agent needs to delegate node work to Bun, Node, Python, or another CLI
- **THEN** the node authoring skill provides a Rhai host API example or reference
