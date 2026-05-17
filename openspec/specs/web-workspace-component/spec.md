# web-workspace-component Specification

## Purpose
Describe the current reusable `OrchidexWorkspace` React component boundary and default connection resolution.
## Requirements
### Requirement: Reusable workspace component
The web package SHALL expose `OrchidexWorkspace` as a reusable React component that accepts an optional `ConnectionStrategy`.

#### Scenario: Connection strategy is provided
- **WHEN** `OrchidexWorkspace` receives a connection prop
- **THEN** it uses that strategy for workspace operations

### Requirement: Default connection resolution
The current workspace component SHALL resolve a default connection strategy when no connection prop is provided.

#### Scenario: No connection prop is provided
- **WHEN** `OrchidexWorkspace` mounts without a connection
- **THEN** it asynchronously resolves the default connection strategy before passing it to the workspace shell
