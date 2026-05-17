# architecture Specification

## Purpose
Describe the high-level current architecture and ownership split between the Rust core, reusable web workspace, and Tauri desktop shell.
## Requirements
### Requirement: Three-part monorepo architecture
Orchidex SHALL be represented as a three-part monorepo with `core/`, `web/`, and `tauri/` as the primary product packages.

#### Scenario: Repository has the primary packages
- **WHEN** a developer inspects the workspace root
- **THEN** the repository contains `core/`, `web/`, and `tauri/` package directories

### Requirement: Core owns runtime logic
The `core/` package SHALL contain the Rust graph model, spark runtime, Rhai node registry helpers, CLI entrypoint, and HTTP/SSE development server.

#### Scenario: Core package exposes runtime entrypoints
- **WHEN** a developer inspects `core/src/`
- **THEN** the package contains source for CLI commands, HTTP routes, graph models, node registry helpers, and runtime state handling

### Requirement: Web exports a reusable workspace
The `web/` package SHALL expose a reusable `OrchidexWorkspace` React component that receives or resolves a typed connection strategy.

#### Scenario: Workspace component is mounted
- **WHEN** the web app renders the workspace
- **THEN** it mounts `OrchidexWorkspace` with a `ConnectionStrategy` contract instead of directly coupling the workspace to one transport

### Requirement: Tauri embeds web and calls core directly
The `tauri/` package SHALL embed the web workspace and call the Rust core directly through Tauri IPC commands.

#### Scenario: Desktop runtime is started
- **WHEN** the Tauri shell starts
- **THEN** it manages a `RuntimeHandle`, exposes IPC commands for graph and spark operations, and forwards runtime events to the web layer
