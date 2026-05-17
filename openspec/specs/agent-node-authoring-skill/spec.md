# agent-node-authoring-skill Specification

## Purpose
Describe the current repo-local skill contract for agents that create, review, or update Orchidex node folders.
## Requirements
### Requirement: Repo-local node authoring skill
The repository SHALL provide a repo-local Orchidex node authoring skill for creating, reviewing, and updating node folders.

#### Scenario: Agent works on node folders
- **WHEN** an agent creates or updates `nodes/**`
- **THEN** it uses the repo-local node authoring guidance

### Requirement: Node authoring workflow
The node authoring skill SHALL document v1 folder shape, manifest requirements, Rhai entrypoint payload shape, host APIs, shell delegation, fixture-first Codex guidance, diagnostics, and cache/freezer behavior.

#### Scenario: Agent needs shell delegation example
- **WHEN** an agent needs to delegate node work to Bun, Node, Python, or another CLI
- **THEN** the node authoring skill provides a Rhai host API example or reference

#### Scenario: Agent authors v1 node
- **WHEN** an agent creates a v1 node
- **THEN** the skill explains how to implement the manifest, entrypoint, schemas, diagnostics, and fixture behavior

