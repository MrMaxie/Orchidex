## ADDED Requirements

### Requirement: Portal fixture scenario
The clients-project fixture set SHALL include a portal-backed graph composition scenario when the prepared flow is split across multiple graphs.

#### Scenario: Fixture enters child graph
- **WHEN** the portal fixture scenario runs
- **THEN** mock parent work enters a child graph and returns a fixture payload through a portal exit
