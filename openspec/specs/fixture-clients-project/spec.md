# fixture-clients-project Specification

## Purpose
Describe the current `clients-project` fixture assets and scenario assumptions.
## Requirements
### Requirement: Clients project fixture graph
The repository SHALL include a `clients-project` graph fixture that models the current manual intake, mail queue, transform, branch selection, and task splitting path.

#### Scenario: Fixture graph is loaded
- **WHEN** the current scenario runner loads the clients-project graph path
- **THEN** it can parse the fixture graph or fall back to the default graph

### Requirement: Mock intake assets
The clients-project fixture folder SHALL include mock input mail data for acceptance-style scenarios.

#### Scenario: Fixture folder is inspected
- **WHEN** a developer inspects `examples/fixtures/clients-project/`
- **THEN** mock mail input data is available next to the graph fixture

### Requirement: Frozen Codex outputs
The clients-project fixture folder SHALL include frozen Codex output files for branch selection and task splitting.

#### Scenario: Codex fixture output is needed
- **WHEN** the current fixture scenario documents Codex output
- **THEN** the expected output is represented by local fixture files
