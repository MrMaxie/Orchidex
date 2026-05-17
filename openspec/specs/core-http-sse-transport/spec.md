# core-http-sse-transport Specification

## Purpose
Describe the current core HTTP command and SSE runtime event transport used by web development mode.
## Requirements
### Requirement: HTTP graph and spark commands
The current core HTTP server SHALL expose graph fetch, graph replace, spark ignite, spark extinguish-all, and health endpoints.

#### Scenario: Web development client replaces graph
- **WHEN** the development client sends a replacement graph to the HTTP server
- **THEN** the core runtime replaces the graph and returns the updated graph payload

### Requirement: SSE runtime events
The current core HTTP server SHALL expose runtime events through an SSE endpoint with named event types.

#### Scenario: Runtime emits a spark event
- **WHEN** the runtime emits a spark event
- **THEN** the SSE stream serializes the event as JSON and labels it with the matching event name

### Requirement: Development CORS
The current HTTP server SHALL allow permissive CORS for local web development.

#### Scenario: Local web app calls core
- **WHEN** the web development app calls the core HTTP server
- **THEN** CORS policy does not block the local request
