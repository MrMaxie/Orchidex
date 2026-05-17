## MODIFIED Requirements

### Requirement: Repo-local node authoring skill
Prepared flows SHALL be able to reference repo-local skills, including the Orchidex node authoring skill, as explicit prompt resources when a graph procedure requires that expertise.

#### Scenario: Agent works on node folders
- **WHEN** an agent creates or updates `nodes/**`
- **THEN** it uses the repo-local node authoring guidance

### Requirement: Node authoring workflow
Prepared flow prompts SHALL identify required skills, subagents, fixtures, and workflow rules as explicit resources rather than hidden assumptions.

#### Scenario: Agent needs shell delegation example
- **WHEN** an agent needs to delegate node work to Bun, Node, Python, or another CLI
- **THEN** the node authoring skill provides a Rhai host API example or reference
