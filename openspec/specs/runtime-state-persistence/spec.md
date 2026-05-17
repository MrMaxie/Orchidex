# runtime-state-persistence Specification

## Purpose
Describe local runtime state persistence for graphs, active sparks, run history, diagnostics, traces, cache metadata, and freezer metadata.
## Requirements
### Requirement: Local runtime store
The runtime SHALL persist graph definitions, active spark summaries, run history, queues, diagnostics, cache metadata, and freezer metadata to local files.

#### Scenario: Run history is inspected after restart
- **WHEN** the runtime restarts after a completed or failed run
- **THEN** prior run history and diagnostics remain inspectable from local storage

### Requirement: Replay metadata
The runtime SHALL store enough trace metadata to replay or inspect the sequence of node entries, exits, waits, failures, blocks, and manual decisions.

#### Scenario: User opens a spark trace
- **WHEN** a user inspects a spark trace
- **THEN** the runtime can return ordered trace steps from persisted metadata
