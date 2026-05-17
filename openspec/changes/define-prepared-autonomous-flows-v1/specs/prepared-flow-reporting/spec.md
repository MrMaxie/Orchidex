## ADDED Requirements

### Requirement: Run report contents
Prepared autonomous flow runs SHALL produce reports covering inputs, work items, prompts, delegated resources, manual decisions, checks, skipped checks, failures, outputs, and next steps.

#### Scenario: User opens completed run report
- **WHEN** the user inspects a completed prepared flow run
- **THEN** the report shows what happened, what passed, what failed, what was skipped, and what still needs attention

### Requirement: Rule improvement capture
Prepared flows SHALL surface repeated manual corrections as candidate rule or graph updates instead of silently changing policy.

#### Scenario: User repeatedly fixes same issue
- **WHEN** the same manual correction appears across runs
- **THEN** the flow reports it as a candidate rule or graph update for user review
