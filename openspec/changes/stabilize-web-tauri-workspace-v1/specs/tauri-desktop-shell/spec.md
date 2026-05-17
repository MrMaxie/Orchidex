## MODIFIED Requirements

### Requirement: Managed runtime handle
The Tauri shell SHALL create and manage the Rust `RuntimeHandle` directly in the desktop process for all desktop operations, without routing through the core CLI or HTTP server.

#### Scenario: IPC command needs runtime state
- **WHEN** an IPC command is invoked
- **THEN** it accesses the managed runtime state instead of calling the core CLI or HTTP server
