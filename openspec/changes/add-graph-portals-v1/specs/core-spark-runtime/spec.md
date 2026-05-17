## ADDED Requirements

### Requirement: Portal-launched child work
The spark runtime SHALL support portal-launched child graph work with a parent spark reference, child run identity, and return route.

#### Scenario: Parent spark enters portal
- **WHEN** a parent spark reaches a valid portal entry
- **THEN** the runtime starts child graph work and records the parent-child relationship

### Requirement: Portal return routing
The spark runtime SHALL resume the parent spark when child graph work exits through a valid portal exit.

#### Scenario: Child graph exits through portal
- **WHEN** child graph work reaches a portal exit
- **THEN** the returned payload resumes the parent spark on the configured return route
