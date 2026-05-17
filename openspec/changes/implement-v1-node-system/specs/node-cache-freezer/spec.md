## ADDED Requirements

### Requirement: Cache node semantics
`std/cache` SHALL map equivalent input payloads to prior output payloads according to configured cache method.

#### Scenario: Cache hit occurs
- **WHEN** an input payload matches a stored cache entry
- **THEN** `std/cache` returns the cached output and records a cache-hit diagnostic

### Requirement: Freezer node semantics
`std/freezer` SHALL return permanently frozen output when present and freeze new output when no frozen value exists.

#### Scenario: Freezer miss occurs
- **WHEN** no frozen output exists for the configured key
- **THEN** the node executes the configured work path, stores the output permanently, and emits that output
