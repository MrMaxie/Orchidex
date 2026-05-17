## ADDED Requirements

### Requirement: Manual gate policy
Prepared flows SHALL pause at manual gates before destructive actions, credential-sensitive operations, unclear acceptance decisions, expensive model/API usage, and live fixture recording.

#### Scenario: Flow reaches destructive action
- **WHEN** a prepared flow is about to perform a destructive action
- **THEN** it waits for explicit user approval before continuing

### Requirement: User remains task boss
Prepared flows SHALL let the user decide task direction while graph-authored procedures handle repeatable routing and validation work.

#### Scenario: Flow encounters ambiguous scope
- **WHEN** a task cannot be safely routed by existing graph policy
- **THEN** the flow pauses and asks for user decision rather than guessing
