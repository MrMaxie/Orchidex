## ADDED Requirements

### Requirement: Debug log node
`debug/log` SHALL log selected payload or diagnostic data to the configured console or file target.

#### Scenario: Debug log receives payload
- **WHEN** `debug/log` receives a spark
- **THEN** it records the configured debug output and emits the configured outgoing payload

### Requirement: Placeholder and note nodes
`debug/placeholder-echo`, `debug/placeholder-rhai`, and `debug/note` SHALL support graph sketching, notes, pass-through payloads, and lightweight Rhai transformation during early flow design.

#### Scenario: Note node is rendered
- **WHEN** `debug/note` appears on a graph
- **THEN** it shows note content without requiring incoming or outgoing spark execution
