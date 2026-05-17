## MODIFIED Requirements

### Requirement: Fixture-first Codex policy
Codex-backed nodes and acceptance scenarios SHALL use fixtures by default and SHALL prevent repeated live Codex calls during tests unless explicit recording mode is enabled.

#### Scenario: Acceptance test includes Codex behavior
- **WHEN** a test or acceptance scenario reaches Codex-backed behavior
- **THEN** it uses a frozen fixture unless live recording has been explicitly enabled

#### Scenario: Codex fixture is missing
- **WHEN** a Codex-backed scenario runs without an existing fixture and recording is disabled
- **THEN** the scenario fails with a fixture-missing diagnostic instead of invoking live Codex

### Requirement: Live recording is explicit
Refreshing or recording live Codex output SHALL require explicit user opt-in and SHALL persist the captured response as a reviewable fixture.

#### Scenario: Recording is not enabled
- **WHEN** a Codex-backed scenario runs without recording mode
- **THEN** it does not invoke live Codex to replace fixtures
