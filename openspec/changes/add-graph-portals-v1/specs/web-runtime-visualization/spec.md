## ADDED Requirements

### Requirement: Portal visualization
The workspace SHALL show graph portal crossings, parent-child trace links, portal entry points, portal exit points, and returned payload summaries.

#### Scenario: Spark crosses graph boundary
- **WHEN** a spark transfers from one graph to another through a portal
- **THEN** the workspace displays the crossing and lets the user inspect both graph traces
