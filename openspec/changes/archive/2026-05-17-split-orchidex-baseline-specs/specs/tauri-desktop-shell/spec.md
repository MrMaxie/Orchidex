## ADDED Requirements

### Requirement: Tauri desktop package
The `tauri` package SHALL provide the desktop application shell for Orchidex.

#### Scenario: Desktop app starts
- **WHEN** the Tauri app starts
- **THEN** it initializes the desktop shell and embeds the web workspace

### Requirement: Managed runtime handle
The current Tauri shell SHALL create and manage a `RuntimeHandle` directly in the Rust desktop process.

#### Scenario: IPC command needs runtime state
- **WHEN** an IPC command is invoked
- **THEN** it accesses the managed runtime state instead of calling the core CLI or HTTP server
