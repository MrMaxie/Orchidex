## MODIFIED Requirements

### Requirement: Typed connection strategy
The web package SHALL define a typed `ConnectionStrategy` interface for graph operations, node catalog discovery, queue control, manual resolution, run history, spark ignition, spark extinguishing, and runtime event subscription.

#### Scenario: Workspace shell receives connection
- **WHEN** the workspace shell receives a connection strategy
- **THEN** it can call typed graph, spark, extinguish, and subscribe operations without knowing the transport implementation

### Requirement: HTTP connection strategy
The HTTP strategy SHALL call the core REST endpoints and subscribe to all v1 runtime events with `EventSource`.

#### Scenario: Runtime event is received through SSE
- **WHEN** the core SSE stream emits a named runtime event
- **THEN** the HTTP strategy parses the JSON event and forwards it to the workspace handler

### Requirement: Tauri connection strategy
The Tauri strategy SHALL use Tauri `invoke` for all v1 runtime commands and Tauri `listen` for runtime events.

#### Scenario: Runtime event is received through Tauri
- **WHEN** the desktop shell emits an `orchidex://runtime-event`
- **THEN** the Tauri strategy forwards the event payload to the workspace handler
