## ADDED Requirements

### Requirement: Dashboard-first navigation
The workspace explorer SHALL start with a special Dashboard item before project and workflow entries.

#### Scenario: User opens the workspace with no prior workflow
- **WHEN** no last-opened workflow is available
- **THEN** the workspace opens Dashboard instead of selecting an arbitrary workflow

#### Scenario: User returns to the workspace
- **WHEN** a last-opened workflow id is available and still exists
- **THEN** the workspace opens that workflow instead of Dashboard

### Requirement: Project metadata includes cwd
Each project SHALL store a `cwd` folder path used as the default working directory for runtime operations that need project filesystem context, including Codex-backed work.

#### Scenario: Codex-capable workflow runs inside a project
- **WHEN** runtime or Codex-backed operations need a working directory
- **THEN** they use the selected project's configured `cwd` unless a more specific operation-level path is supplied

### Requirement: Workspace data separates metadata, graph, navigation, and activity
The web workspace contracts SHALL model project metadata, workflow graph data, last-opened workflow navigation state, and spark-derived activity as separate values.

#### Scenario: Runtime events update workflow activity
- **WHEN** spark events change active, blocked, completed, or extinguished spark counts
- **THEN** the workspace updates workflow activity from spark data without mutating project metadata or workflow graph data

#### Scenario: User switches workflows
- **WHEN** the user selects a workflow from the explorer
- **THEN** the workspace stores that workflow id as last-opened navigation state separately from project metadata and graph structure

### Requirement: GUI project creation
The workspace SHALL let users create projects from the GUI with a name and editable `cwd` path.

#### Scenario: User creates a project
- **WHEN** the user submits a new project from the workspace GUI
- **THEN** the project appears in the explorer with its metadata and can own workflows

### Requirement: GUI workflow creation
The workspace SHALL let users create workflows inside a project from the GUI.

#### Scenario: User creates a workflow
- **WHEN** the user creates a workflow in a project
- **THEN** the workspace creates an editable graph surface associated with that project and opens it

### Requirement: Workflow duplication
The workspace SHALL let users duplicate an existing workflow inside the same project.

#### Scenario: User duplicates a workflow
- **WHEN** the user duplicates a workflow
- **THEN** the workspace creates a new workflow with copied graph structure, new workflow identity, and no active spark state copied from the source workflow
