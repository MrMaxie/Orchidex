## MODIFIED Requirements

### Requirement: Root validation commands
Prepared flows SHALL be able to run configured root validation commands and record command output, pass/fail state, and skipped-command reasons.

#### Scenario: Developer runs validation
- **WHEN** a developer runs root validation scripts
- **THEN** the scripts route to the appropriate Turbo, Bun, Cargo, or Tauri command

#### Scenario: Prepared flow validates work
- **WHEN** a prepared implementation task completes
- **THEN** the flow runs configured validation commands or records why a validation command was skipped

### Requirement: UI validation commands
Web behavior changes in prepared flows SHALL require web checks/builds and live browser or Tauri verification when behavior matters.

#### Scenario: Workspace UI changes
- **WHEN** workspace UI behavior changes
- **THEN** web checks/builds and live browser or Tauri verification are expected
