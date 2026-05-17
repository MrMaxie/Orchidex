## MODIFIED Requirements

### Requirement: HTTP graph and spark commands
The core HTTP server SHALL expose graph, spark, node catalog, queue control, manual resolution, run history, and health endpoints required by the v1 workspace.

#### Scenario: Web development client replaces graph
- **WHEN** the development client sends a replacement graph to the HTTP server
- **THEN** the core runtime replaces the graph and returns the updated graph payload

### Requirement: SSE runtime events
The core HTTP server SHALL expose all v1 runtime events through an SSE endpoint with named event types.

#### Scenario: Runtime emits a spark event
- **WHEN** the runtime emits a spark event
- **THEN** the SSE stream serializes the event as JSON and labels it with the matching event name
