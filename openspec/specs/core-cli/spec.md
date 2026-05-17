# core-cli Specification

## Purpose
Describe the current `orchidex-core` CLI command surface and fixture scenario entrypoint.
## Requirements
### Requirement: Core CLI command surface
The current `orchidex-core` CLI SHALL provide commands for serving HTTP/SSE, running the clients-project scenario, igniting a demo spark, and extinguishing active demo sparks.

#### Scenario: Developer starts core server
- **WHEN** a developer runs the serve command
- **THEN** the CLI starts the core HTTP/SSE server on the configured address

### Requirement: Scenario command uses fixture path
The scenario command SHALL default to the `examples/fixtures/clients-project/graph.json` fixture path.

#### Scenario: Developer runs scenario without arguments
- **WHEN** the scenario command is run without a graph path
- **THEN** it uses the default clients-project graph fixture path
