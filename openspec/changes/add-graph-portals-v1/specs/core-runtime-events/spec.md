## ADDED Requirements

### Requirement: Portal runtime events
The runtime event stream SHALL include portal-entered, portal-exited, portal-returned, portal-blocked, and portal-cancelled events.

#### Scenario: Portal transfer starts
- **WHEN** a spark enters a target graph through a portal
- **THEN** the runtime emits an event containing parent spark id, child run id, source graph id, target graph id, and portal id

### Requirement: Portal trace events
Portal events SHALL contain enough data for clients to connect parent and child traces.

#### Scenario: User inspects portal trace
- **WHEN** a client receives portal events for a run
- **THEN** it can reconstruct source graph, target graph, entry portal, exit portal, and returned payload summary
