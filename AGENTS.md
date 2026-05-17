# AGENTS.md

## Project brief

- Purpose: Orchidex is a Tauri + React + TypeScript graph workspace targeting web and desktop.
- Architecture: Vite serves the React frontend from `src/`; Tauri owns the desktop shell and Rust backend in `src-tauri/`.
- Source of truth: keep this file, `README.md`, package manifests, and Tauri config aligned when setup or commands change.

## Repo map

- `src/`: React app, Tailwind CSS entrypoint, and ReactFlow UI.
- `src-tauri/`: Tauri v2 app configuration, Rust commands, and desktop build metadata.
- `public/`: static assets served by Vite.
- `.agents/`: local skill cache; ignored and not part of the project source.

## Workflow

- Install dependencies with `bun install`; in CI prefer `bun ci` after `bun.lock` exists.
- Run the web app with `bun run dev`.
- Run the desktop app with `bun tauri dev`.
- Build the web target with `bun run build`.
- Run a quick Rust backend check with `cargo check --manifest-path src-tauri/Cargo.toml`.
- Build the desktop target with `bun tauri build`; treat this as a heavier validation step.

## Engineering rules

- Use Bun for frontend dependencies and Cargo for Rust dependencies; do not hand-edit dependency versions when a package manager command can do it.
- Add npm packages with exact versions, for example `bun add <pkg> --exact` or `bun add --dev <pkg> --exact`.
- Tailwind CSS uses v4 CSS-first setup through `@tailwindcss/vite`; do not add legacy Tailwind v3 PostCSS config unless the project explicitly migrates.
- ReactFlow is provided by `@xyflow/react`; import its stylesheet after Tailwind in the global CSS entrypoint.
- Keep outward-facing project files, code, comments, and commit messages in English unless the user asks otherwise.
- Use conventional commits in English with `fix:`, `feat:`, or `chore:` and no scope.

## Skill routing

| Task signal | Use skill | Notes |
| --- | --- | --- |
| Tauri app setup, desktop shell, cross-platform behavior | `$tauri-development` | Use for app lifecycle, build, and Tauri integration decisions. |
| Rust backend commands, filesystem, IPC, permissions | `$rust-tauri-backend` | Use for non-trivial Rust/Tauri backend changes. |
| Rust-to-frontend events or frontend calls from Rust | `$calling-frontend-from-tauri-rust` | Use when wiring Tauri events, emit calls, or JS evaluation. |
| ReactFlow canvases, DAGs, custom nodes, graph state | `$reactflow-expert` or `$react-flow-architect` | Use for graph visualization and node editor behavior. |
| Tailwind tokens, UI systems, reusable styling patterns | `$tailwind-design-system` | Use for Tailwind v4 design system work. |
| Agent instructions | `$agents-md-maintainer` | Use when creating or updating `AGENTS.md` or `.local/AGENTS.md`. |

## Done means

- Relevant web and Rust checks were run, or skipped with a concrete reason.
- UI changes were checked in a live browser or Tauri window when behavior matters.
- The final response names changed files and validation results.
- If `.local/` is ever created, add `.local` to `.git/info/exclude`.
