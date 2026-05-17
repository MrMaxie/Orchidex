## MODIFIED Requirements

### Requirement: Clients project fixture graph
The clients-project fixture SHALL represent the canonical v1 prepared autonomous flow with manual intake, mock mail intake, accumulation, gates, one-by-one work release, Codex branch selection, Codex task splitting, verification, review, and final reporting.

#### Scenario: Fixture graph is loaded
- **WHEN** the current scenario runner loads the clients-project graph path
- **THEN** it can parse the fixture graph or fall back to the default graph

#### Scenario: Prepared flow fixture runs
- **WHEN** the clients-project prepared flow scenario runs
- **THEN** it processes mock intake through the configured graph path without repeated live Codex calls

### Requirement: Mock intake assets
The clients-project fixture folder SHALL include mock mail, PR, Jira, manual intake, work-stack, verification, review, and reporting data for acceptance-style scenarios.

#### Scenario: Fixture folder is inspected
- **WHEN** a developer inspects `examples/fixtures/clients-project/`
- **THEN** mock mail input data is available next to the graph fixture

### Requirement: Frozen Codex outputs
The clients-project fixture folder SHALL include frozen Codex output files for branch selection with `5.3-Codex-Spark@medium` and task splitting with `5.3@high`.

#### Scenario: Codex fixture output is needed
- **WHEN** the current fixture scenario documents Codex output
- **THEN** the expected output is represented by local fixture files

#### Scenario: Task reaches branch selection
- **WHEN** a task reaches the branch-selection Codex node
- **THEN** the scenario uses the frozen branch-selection fixture and records the selected or created branch in the outgoing payload
