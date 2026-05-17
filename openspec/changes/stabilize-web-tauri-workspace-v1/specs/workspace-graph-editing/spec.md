## ADDED Requirements

### Requirement: Live graph editing
The workspace SHALL allow graph edits while sparks are active and SHALL show runtime reconciliation results for blocked or waiting sparks.

#### Scenario: User removes active route
- **WHEN** the user edits the graph in a way that invalidates an active spark route
- **THEN** the workspace shows the runtime diagnostic for the affected spark

### Requirement: Manual and queue controls
The workspace SHALL expose controls for manual ignite, manual accept/reject, queue release, queue lock state, and extinguish-all when those operations are available.

#### Scenario: User releases queued spark
- **WHEN** the user releases a queued spark through the workspace
- **THEN** the runtime resumes the spark and the workspace updates from emitted events
