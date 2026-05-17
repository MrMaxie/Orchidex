## ADDED Requirements

### Requirement: Workspace package layout
The repository SHALL be organized as a Bun and Cargo monorepo with `core`, `web`, and `tauri` as workspace packages.

#### Scenario: Developer inspects workspace manifests
- **WHEN** a developer inspects the root manifests
- **THEN** `package.json` lists the Bun workspaces and `Cargo.toml` lists the Rust workspace members

### Requirement: Package manager ownership
Frontend dependencies SHALL be managed with Bun, and Rust dependencies SHALL be managed with Cargo.

#### Scenario: Dependency is added
- **WHEN** a dependency must be added to an existing package
- **THEN** the matching package manager command is used instead of manually editing dependency versions
