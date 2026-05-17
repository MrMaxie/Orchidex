## MODIFIED Requirements

### Requirement: Reusable workspace component
The web package SHALL expose `OrchidexWorkspace` as a reusable React component that accepts an optional `ConnectionStrategy`, stays transport-agnostic, and can be embedded by both web development and Tauri desktop shells.

#### Scenario: Connection strategy is provided
- **WHEN** `OrchidexWorkspace` receives a connection prop
- **THEN** it uses that strategy for workspace operations

#### Scenario: Workspace is embedded in desktop shell
- **WHEN** the Tauri shell mounts the web workspace
- **THEN** the same component receives or resolves the Tauri IPC strategy without desktop-specific UI forks

### Requirement: Default connection resolution
The workspace component SHALL resolve a default connection strategy when no connection prop is provided and SHALL choose HTTP/SSE outside Tauri and IPC inside Tauri.

#### Scenario: No connection prop is provided
- **WHEN** `OrchidexWorkspace` mounts without a connection
- **THEN** it asynchronously resolves the default connection strategy before passing it to the workspace shell
