## MODIFIED Requirements

### Requirement: Fixture-first Codex policy
Codex-backed prepared flow scenarios SHALL use fixtures by default and SHALL avoid repeated live Codex calls during tests.

#### Scenario: Acceptance test includes Codex behavior
- **WHEN** a test or acceptance scenario reaches Codex-backed behavior
- **THEN** it uses a frozen fixture unless live recording has been explicitly enabled

### Requirement: Live recording is explicit
Prepared flows SHALL require explicit user approval before recording or refreshing live Codex fixture output.

#### Scenario: Recording is not enabled
- **WHEN** a Codex-backed scenario runs without recording mode
- **THEN** it does not invoke live Codex to replace fixtures
