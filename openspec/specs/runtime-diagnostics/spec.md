# runtime-diagnostics Specification

## Purpose
Describe runtime diagnostics emitted and persisted for blocked, failed, waiting, completed, and extinguished spark work.
## Requirements
### Requirement: Diagnostic shape
Runtime diagnostics SHALL include a machine-readable kind, user-readable message, spark id when available, graph id, node id when available, and structured context.

#### Scenario: Node execution fails
- **WHEN** node execution returns an error
- **THEN** the diagnostic identifies the failed node, spark, error kind, and user-readable message

### Requirement: State-specific reasons
Blocked, failed, waiting, extinguished, and completed sparks SHALL record state-specific reasons where the reason is meaningful to later inspection.

#### Scenario: Spark is blocked by live edit
- **WHEN** a spark is blocked because a live edit removed a required route
- **THEN** the reason identifies the removed route or missing target node
