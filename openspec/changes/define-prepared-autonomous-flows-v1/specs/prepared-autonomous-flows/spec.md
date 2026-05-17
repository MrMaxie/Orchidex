## ADDED Requirements

### Requirement: Boss-controlled autonomy
Prepared autonomous flows SHALL execute only graph-authored procedures and SHALL preserve user control through explicit manual gates for high-risk or ambiguous decisions.

#### Scenario: Flow reaches a destructive action
- **WHEN** a prepared flow is about to perform a destructive action
- **THEN** the runtime pauses at a manual gate and requires user approval before continuing

### Requirement: Repeatable development hygiene
Prepared flows SHALL encode repeated development hygiene steps including acceptance criteria checks, code quality checks, tests, review loops, rule updates, and final reporting.

#### Scenario: Implementation task completes
- **WHEN** an implementation task finishes
- **THEN** the flow runs configured verification steps or records why a step was skipped

### Requirement: Prompt preparation
Codex prompt nodes in prepared flows SHALL build prompts from the spark payload, graph context, node configuration, available skills, selected subagents, fixtures, and acceptance criteria.

#### Scenario: Branch selection prompt is built
- **WHEN** a work item reaches the branch selection Codex node
- **THEN** the prompt includes the task payload, branch-selection policy, available repository context, and configured model `5.3-Codex-Spark@medium`

### Requirement: Work queue discipline
Prepared flows SHALL support one-by-one processing when configured, so queued tasks can be handled without uncontrolled competition.

#### Scenario: Queue is configured for serial work
- **WHEN** multiple work items are available in the work stack
- **THEN** the flow releases only the next eligible spark until the active work item reaches a configured completion or gate state

### Requirement: Inspectable run report
Each prepared autonomous flow run SHALL produce an inspectable report covering inputs, decisions, delegated work, checks, skipped checks, failures, manual approvals, final outputs, and suggested next steps.

#### Scenario: User opens completed run
- **WHEN** the user inspects a completed prepared flow run
- **THEN** the report shows what happened, which checks passed or failed, and which decisions required manual input
