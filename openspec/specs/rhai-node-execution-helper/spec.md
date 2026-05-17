# rhai-node-execution-helper Specification

## Purpose
Describe the current Rhai payload conversion helper and placeholder host API behavior.
## Requirements
### Requirement: JSON to Rhai conversion
The current Rhai execution helper SHALL convert JSON-compatible payload values into Rhai dynamic values before evaluating a script.

#### Scenario: Object payload is executed
- **WHEN** the helper receives a JSON object payload
- **THEN** it exposes the object to Rhai as `payload`

### Requirement: Rhai to JSON conversion
The current Rhai execution helper SHALL convert Rhai dynamic values back to JSON-compatible values after evaluation.

#### Scenario: Rhai script returns array
- **WHEN** a Rhai script returns an array
- **THEN** the helper converts it into a JSON array

### Requirement: Host API stubs
The current Rhai helper SHALL register host functions for log, shell, cache, freezer, and scheduling, with several functions still implemented as placeholders.

#### Scenario: Rhai script calls shell helper
- **WHEN** the current helper executes a shell call
- **THEN** it returns a placeholder shell delegation string rather than executing an external process
