# AGENTS.md

## Project brief

- Purpose: Orchidex is a spark-driven graph runtime and workspace for web and desktop.
- Architecture: the repo is a three-part monorepo:
  - `core/`: Rust graph model, spark runtime, Rhai node loader, CLI, and HTTP/SSE dev server.
  - `web/`: React + TypeScript GUI exporting the reusable `OrchidexWorkspace` component.
  - `tauri/`: Tauri desktop shell that embeds `web` and calls `core` directly through IPC.
- Source of truth: keep this file, `README.md`, package manifests, Cargo manifests, and Tauri config aligned when setup or commands change.

## Repo map

- `core/`: Rust library and `orchidex-core` CLI.
- `web/src/`: React app, Tailwind CSS entrypoint, ReactFlow UI, contracts, and connection strategies.
- `tauri/src-tauri/`: Tauri v2 desktop shell and IPC commands.
- `nodes/`: folder-based node definitions; every node folder contains `node.toml` and `main.rhai`.
- `examples/fixtures/`: mock scenarios and frozen responses used by tests and acceptance checks.
- `.agents/skills/`: repo-local skills available to agents; treat them as tooling, not product source.

## Workflow

- Install frontend dependencies with `bun install`; in CI prefer `bun ci` after `bun.lock` exists.
- Run the web app with `bun run dev`.
- Run the core HTTP/SSE server with `bun run core:serve`.
- Run the desktop app with `bun run tauri dev`.
- Build the web target with `bun run build`.
- Run Rust checks with `cargo check --workspace`.
- Run Rust tests with `cargo test --workspace`.
- Build the desktop target with `bun run tauri build`; treat this as a heavier validation step.

## Engineering rules

- Use Bun for frontend dependencies and Cargo for Rust dependencies; do not hand-edit dependency versions when a package manager command can do it.
- Add npm packages with exact versions, for example `bun add <pkg> --exact` or `bun add --dev <pkg> --exact`.
- Add Rust packages with exact versions when possible, for example `cargo add crate@=version`.
- Tailwind CSS uses v4 CSS-first setup through `@tailwindcss/vite`; do not add legacy Tailwind v3 PostCSS config unless the project explicitly migrates.
- The app uses the `@/*` import alias for `web/src/*`; keep Vite and TypeScript alias configuration aligned.
- Shadcn is initialized with `web/components.json`; add or update UI primitives from the `web/` package with `bunx --bun shadcn@latest`, then review generated source under `web/src/components/ui/`.
- Use shadcn `ScrollArea` for scrollable app panes instead of native overflow-only scrollbars, especially sidebars, inspectors, and modal lists.
- Prefer shadcn primitives such as `Button`, `Badge`, `Tabs`, `Dialog`, `Command`, `Field`, `Input`, `Textarea`, `Select`, `Separator`, `Collapsible`, and `Tooltip` before custom UI markup.
- Use Tabler icons for app-specific navigation and workflow status icons; generated shadcn primitives may use their configured icon library.
- ReactFlow is provided by `@xyflow/react`; import its stylesheet after Tailwind in the global CSS entrypoint.
- Keep `web` Tauri-free except for `web/src/features/workspace/connections/tauri-ipc-connection.ts`.
- Keep outward-facing project files, code, comments, and commit messages in English unless the user asks otherwise.
- Use conventional commits in English with `fix:`, `feat:`, or `chore:` and no scope.

## Workspace UI map

- Dashboard is not a workflow. In `web/src/features/workspace/components/workspace-shell.tsx`, render workflow headers and workflow actions only when `activeWorkflow` exists.
- Explorer ownership is split: `navigation/project-tree.tsx` owns the Dashboard/project level, while `navigation/project-tree-file.tsx` owns workflows and per-workflow row actions such as duplicate.
- Workflow duplication should accept a `workflowId` so tree actions duplicate the targeted workflow, not only the currently active workflow.
- Project `cwd` defaults and fixture metadata must stay absolute; do not fall back to `"."` for visible project paths.
- Node `app` and `connector` are runtime identity fields. The node inspector may display them, but should not expose them as editable user inputs.
- Default visible workspace labels and action text often come from `data/mock-projects.ts` and `config/status-meta.tsx`, not only from rendered components.
- ReactFlow canvas controls in `workflow-canvas.tsx` require styling through ReactFlow `Panel`, `Controls`, and nested control selectors because the library owns part of the DOM.
- When validating only the web app without `core:serve`, `127.0.0.1:3869` connection failures are expected and should not be treated as UI regressions.

## Node authoring

- Use `.agents/skills/orchidex-node-authoring/` when creating or updating Orchidex node folders.
- Node ids must match their folder namespace, for example `nodes/std/manual-ignite` uses `id = "std/manual-ignite"`.
- `node.toml` holds metadata, config schema hints, capabilities, and the Rhai entrypoint path.
- `main.rhai` receives JSON-compatible `payload` and returns the outgoing payload, or `()` for no output.
- Codex-backed nodes must be fixture-first in tests; do not repeatedly invoke live Codex while running acceptance scenarios.

## Skill routing

Repo-local skills are installed under `.agents/skills/` and should be considered alongside globally available skills when they match the task.

| Task signal | Use skill | Notes |
| --- | --- | --- |
| Node folders, `node.toml`, Rhai entrypoints, fixture-first Codex nodes | `$orchidex-node-authoring` | Use for node creation, review, and host API examples. |
| Tauri app setup, desktop shell, cross-platform behavior | `$tauri-development` or `$tauri-desktop` | Prefer `$tauri-development` for general implementation guidance; use `$tauri-desktop` for broader Tauri platform, plugin, packaging, or security-model decisions. |
| Rust backend commands, filesystem, IPC, permissions | `$rust-tauri-backend` | Use for non-trivial Rust/Tauri backend changes in `tauri/src-tauri/`. |
| Rust-to-frontend events or frontend calls from Rust | `$calling-frontend-from-tauri-rust` | Use when wiring Tauri events, emit calls, channels, or JS evaluation. |
| ReactFlow canvases, DAGs, custom nodes, graph state | `$reactflow-expert` or `$react-flow-architect` | Prefer `$reactflow-expert` for DAG/custom-node/live-update work; use `$react-flow-architect` for architecture, hierarchy, and state design. |
| Tailwind v4 setup, utility-vs-CSS choices, style drift | `$busirocket-tailwindcss-v4` or `$tailwind-design-system` | Prefer the local Tailwind v4 skill for implementation details in this repo. |
| Shadcn component setup or registry-driven UI work | `$shadcn` | Use when adding or debugging shadcn/ui components or `components.json`-driven workflows. |
| MCP server or tool/resource/prompt integration work | `$mcp-protocol-builder` | Use when Orchidex work expands into MCP tooling or AI-native integrations. |

## Done means

- Relevant web and Rust checks were run, or skipped with a concrete reason.
- UI changes were checked in a live browser or Tauri window when behavior matters.
- The final response names changed files and validation results.
- If `.local/` is ever created, add `.local` to `.git/info/exclude`.
