## ADDED Requirements

### Requirement: Manual input nodes
`std/manual-ignite` SHALL start sparks from structured user form data, and `std/manual-accept` SHALL pause sparks until the user accepts, rejects, or edits the payload.

#### Scenario: User accepts waiting spark
- **WHEN** a spark waits at `std/manual-accept` and the user accepts it
- **THEN** the runtime resumes the spark with the accepted payload and records the manual decision

### Requirement: Transform and decision nodes
`std/transmute`, `std/filter`, and `std/merge` SHALL transform, filter, or merge JSON-compatible payloads according to node configuration.

#### Scenario: Filter rejects spark
- **WHEN** `std/filter` evaluates its predicate to false
- **THEN** the spark records the filter decision and does not continue through the normal accepted route

### Requirement: Queue and scheduler nodes
`std/accumulation`, `std/sleep`, and `std/cron` SHALL provide queueing, delayed continuation, and scheduled spark ignition.

#### Scenario: Accumulation is locked
- **WHEN** `std/accumulation` receives sparks while output is locked
- **THEN** the sparks remain queued until the queue is released
