## ADDED Requirements

### Requirement: Source of truth alignment
Project setup and command changes SHALL keep `AGENTS.md`, `README.md`, package manifests, Cargo manifests, and Tauri configuration aligned.

#### Scenario: Setup command changes
- **WHEN** a setup, build, validation, or runtime command changes
- **THEN** the relevant source-of-truth documents and manifests are updated together

### Requirement: External artifact language
Outward-facing files, code comments, commit messages, OpenSpec artifacts, and external resources SHALL be written in English unless the user explicitly asks otherwise.

#### Scenario: OpenSpec artifact is written
- **WHEN** an OpenSpec proposal, design, task list, or spec is created
- **THEN** the artifact text is written in English

### Requirement: Local-only files
If a `.local/` directory exists, it SHALL be excluded through `.git/info/exclude`.

#### Scenario: Local folder appears
- **WHEN** `.local/` is present in the repository
- **THEN** `.git/info/exclude` contains `.local`
