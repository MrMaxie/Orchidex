## MODIFIED Requirements

### Requirement: Host API stubs
The Rhai execution helper SHALL replace placeholder host API stubs with runtime-owned host APIs for logs, shell delegation, cache, freezer, timers, Codex fixtures, diagnostics, and node outcomes.

#### Scenario: Rhai script calls shell helper
- **WHEN** the current helper executes a shell call
- **THEN** it returns a placeholder shell delegation string rather than executing an external process

#### Scenario: Rhai script calls v1 shell helper
- **WHEN** a v1 Rhai node delegates to shell
- **THEN** the runtime executes through the controlled host API and records command, output, exit status, and diagnostics

### Requirement: JSON to Rhai conversion
The Rhai execution helper SHALL convert JSON-compatible payload and node context values into Rhai dynamic values before evaluating a script.

#### Scenario: Object payload is executed
- **WHEN** the helper receives a JSON object payload
- **THEN** it exposes the object to Rhai as `payload`

### Requirement: Rhai to JSON conversion
The Rhai execution helper SHALL convert Rhai dynamic values and supported node outcome objects back to JSON-compatible runtime values after evaluation.

#### Scenario: Rhai script returns array
- **WHEN** a Rhai script returns an array
- **THEN** the helper converts it into a JSON array
