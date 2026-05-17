## MODIFIED Requirements

### Requirement: IPC command bridge
The Tauri shell SHALL expose IPC commands for graph operations, node catalog discovery, queue control, manual resolution, run history, spark ignition, and spark extinguishing.

#### Scenario: Workspace invokes ignite through IPC
- **WHEN** the Tauri connection strategy invokes the ignite command
- **THEN** the desktop shell calls the managed core runtime and returns the spark payload

### Requirement: Runtime event forwarding
The Tauri shell SHALL forward all v1 core runtime events to the web workspace through the `orchidex://runtime-event` channel.

#### Scenario: Runtime emits event in desktop mode
- **WHEN** the managed runtime emits an event
- **THEN** the Tauri shell forwards that event to the web layer
