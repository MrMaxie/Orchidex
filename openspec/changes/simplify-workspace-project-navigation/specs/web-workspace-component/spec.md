## ADDED Requirements

### Requirement: Direct workspace project navigation
The workspace explorer SHALL render available projects directly in the navigation tree without exposing fixed project category folders that are not backed by distinct runtime or user-created project categories.

#### Scenario: Projects are loaded
- **WHEN** the workspace has one or more projects
- **THEN** the explorer shows those projects without an empty `Debug` project folder

#### Scenario: Debug nodes are available
- **WHEN** debug node catalog entries such as `debug/log` are available
- **THEN** they remain discoverable through the node catalog rather than through project grouping
