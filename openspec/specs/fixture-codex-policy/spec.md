# fixture-codex-policy Specification

## Purpose
Describe the current fixture-first policy for Codex-backed behavior in tests and acceptance scenarios.
## Requirements
### Requirement: Fixture-first Codex policy
Codex-backed nodes and acceptance scenarios SHALL use fixtures by default and SHALL avoid repeated live Codex calls during tests.

#### Scenario: Acceptance test includes Codex behavior
- **WHEN** a test or acceptance scenario reaches Codex-backed behavior
- **THEN** it uses a frozen fixture unless live recording has been explicitly enabled

### Requirement: Live recording is explicit
Refreshing or recording live Codex output SHALL require explicit user opt-in.

#### Scenario: Recording is not enabled
- **WHEN** a Codex-backed scenario runs without recording mode
- **THEN** it does not invoke live Codex to replace fixtures
