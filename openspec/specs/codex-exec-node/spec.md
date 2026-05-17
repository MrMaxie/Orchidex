# codex-exec-node Specification

## Purpose
TBD - created by archiving change implement-v1-node-system. Update Purpose after archive.
## Requirements
### Requirement: Codex prompt execution
`codex/exec` SHALL transform incoming payload and node configuration into a Codex CLI prompt, model selection, and reasoning effort selection.

#### Scenario: Branch selection prompt runs from fixture
- **WHEN** `codex/exec` is configured with the branch-selection fixture
- **THEN** it returns the frozen fixture response without invoking live Codex

### Requirement: Codex response payload
`codex/exec` SHALL return the Codex response, fixture metadata, model, effort, and execution diagnostics as the outgoing payload.

#### Scenario: Codex fixture completes
- **WHEN** a fixture-backed Codex execution completes
- **THEN** the outgoing payload includes the fixture output and enough metadata to trace which fixture was used

