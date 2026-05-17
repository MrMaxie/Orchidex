## MODIFIED Requirements

### Requirement: Node authoring workflow
The node authoring skill SHALL document v1 folder shape, manifest requirements, Rhai entrypoint payload shape, host APIs, shell delegation, fixture-first Codex guidance, diagnostics, and cache/freezer behavior.

#### Scenario: Agent needs shell delegation example
- **WHEN** an agent needs to delegate node work to Bun, Node, Python, or another CLI
- **THEN** the node authoring skill provides a Rhai host API example or reference

#### Scenario: Agent authors v1 node
- **WHEN** an agent creates a v1 node
- **THEN** the skill explains how to implement the manifest, entrypoint, schemas, diagnostics, and fixture behavior
