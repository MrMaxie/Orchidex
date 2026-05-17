## ADDED Requirements

### Requirement: Root validation commands
The repository SHALL expose root scripts for development, build, check, test, core server, and desktop workflows.

#### Scenario: Developer runs validation
- **WHEN** a developer runs root validation scripts
- **THEN** the scripts route to the appropriate Turbo, Bun, Cargo, or Tauri command

### Requirement: Rust validation commands
Rust validation SHALL use Cargo workspace commands for checks and tests.

#### Scenario: Runtime behavior changes
- **WHEN** runtime or Rust backend behavior changes
- **THEN** `cargo check --workspace` and relevant Rust tests are the expected validation path

### Requirement: UI validation commands
Web behavior changes SHALL use Bun/Turbo web checks and build commands, with live browser or desktop verification when behavior matters.

#### Scenario: Workspace UI changes
- **WHEN** workspace UI behavior changes
- **THEN** web checks/builds and live browser or Tauri verification are expected
