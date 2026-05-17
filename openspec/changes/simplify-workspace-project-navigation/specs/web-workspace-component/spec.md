## ADDED Requirements

### Requirement: Direct workspace project navigation
The workspace explorer SHALL render available projects directly in the navigation tree without exposing fixed project category folders that are not backed by distinct runtime or user-created project categories.

#### Scenario: Projects are loaded
- **WHEN** the workspace has one or more projects
- **THEN** the explorer shows those projects without an empty `Debug` project folder

#### Scenario: Debug nodes are available
- **WHEN** debug node catalog entries such as `debug/log` are available
- **THEN** they remain discoverable through the node catalog rather than through project grouping

### Requirement: Dashboard route is not a workflow
The workspace shell SHALL treat Dashboard as a workspace-level route rather than a workflow graph.

#### Scenario: Dashboard is selected
- **WHEN** no active workflow is selected
- **THEN** the workspace shell renders the dashboard content without a workflow header or duplicate Dashboard title

### Requirement: Workflow row actions belong to the project tree
Workflow-specific structural actions SHALL be exposed on workflow rows in the project tree rather than in the main workflow header.

#### Scenario: A workflow is duplicated from the tree
- **WHEN** a user invokes duplicate on a workflow row
- **THEN** the app duplicates that targeted workflow by id

### Requirement: Project paths are absolute in visible defaults
The workspace UI SHALL use absolute project `cwd` values for fixture metadata and newly-created project defaults.

#### Scenario: Fixture project is displayed
- **WHEN** the default fixture project is shown
- **THEN** its `cwd` is an absolute filesystem path

### Requirement: Node runtime identity is read-only in the inspector
The node inspector SHALL not expose node runtime identity fields such as `app` and `connector` as editable inputs.

#### Scenario: A node is selected
- **WHEN** the inspector renders node configuration
- **THEN** it may display the node type identity read-only and keeps user editing to mutable fields such as label, status, and description
