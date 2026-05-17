# AGENTS.md

## Project brief

- Purpose: Orchidex is a Tauri + React + TypeScript graph workspace targeting web and desktop.
- Architecture: Vite serves the React frontend from `src/`; Tauri owns the desktop shell and Rust backend in `src-tauri/`.
- Source of truth: keep this file, `README.md`, package manifests, and Tauri config aligned when setup or commands change.

## Repo map

- `src/`: React app, Tailwind CSS entrypoint, and ReactFlow UI.
- `src-tauri/`: Tauri v2 app configuration, Rust commands, and desktop build metadata.
- `public/`: static assets served by Vite.
- `.agents/skills/`: repo-local skill installs available to the agent for this workspace; treat them as tooling, not product source.

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
- The app uses the `@/*` import alias for `src/*`; keep Vite and TypeScript alias configuration aligned.
- Shadcn is initialized with `components.json`; add or update UI primitives with `bunx --bun shadcn@latest`, then review the generated source under `src/components/ui/`.
- Use shadcn `ScrollArea` for scrollable app panes instead of native overflow-only scrollbars, especially sidebars, inspectors, and modal lists.
- Prefer shadcn primitives such as `Button`, `Badge`, `Tabs`, `Dialog`, `Command`, `Field`, `Input`, `Textarea`, `Select`, `Separator`, `Collapsible`, and `Tooltip` before custom UI markup.
- Use Tabler icons for app-specific navigation and workflow status icons; generated shadcn primitives may use their configured icon library.
- ReactFlow is provided by `@xyflow/react`; import its stylesheet after Tailwind in the global CSS entrypoint.
- Keep outward-facing project files, code, comments, and commit messages in English unless the user asks otherwise.
- Use conventional commits in English with `fix:`, `feat:`, or `chore:` and no scope.

## Skill routing

Repo-local skills are installed under `.agents/skills/` and should be considered alongside globally available skills when they match the task.

| Task signal | Use skill | Notes |
| --- | --- | --- |
| Tauri app setup, desktop shell, cross-platform behavior | `$tauri-development` or `$tauri-desktop` | Prefer `$tauri-development` for general implementation guidance; use `$tauri-desktop` for broader Tauri platform, plugin, packaging, or security-model decisions. |
| Rust backend commands, filesystem, IPC, permissions | `$rust-tauri-backend` | Use for non-trivial Rust/Tauri backend changes in `src-tauri/`. |
| Rust-to-frontend events or frontend calls from Rust | `$calling-frontend-from-tauri-rust` | Use when wiring Tauri events, emit calls, channels, or JS evaluation. |
| ReactFlow canvases, DAGs, custom nodes, graph state | `$reactflow-expert` or `$react-flow-architect` | Prefer `$reactflow-expert` for DAG/custom-node/ELK/live-update work; use `$react-flow-architect` for architecture, hierarchy, and state design. |
| Tailwind v4 setup, utility-vs-CSS choices, style drift | `$busirocket-tailwindcss-v4` or `$tailwind-design-system` | Prefer the local Tailwind v4 skill for implementation details in this repo; use `$tailwind-design-system` for broader token/system work. |
| Shadcn component setup or registry-driven UI work | `$shadcn` | Use when adding or debugging shadcn/ui components or `components.json`-driven workflows. |
| MCP server or tool/resource/prompt integration work | `$mcp-protocol-builder` | Use when Orchidex work expands into MCP tooling or AI-native integrations. |
| OpenAI Codex issue triage | `$codex-bug` | Use only for diagnosing issues from `openai/codex` GitHub issue URLs. |
| Long autonomous modify-verify loops | `$codex-autoresearch-loop` | Use when the user explicitly wants unattended iterative improvement toward a measurable goal. |
| Multi-agent Codex/Claude/Cursor orchestration | `$codex-claude-loop` or `$codex-claude-cursor-loop` | Use only when the user explicitly wants that cross-agent workflow. |
| Parallel Codex review escalation loop | `$loop-codex-review` | Use when the user explicitly asks for repeated review rounds until a clean result. |
| Codex exec fan-out in worktrees | `$codex-skill` or `$run-codex-exec` | Use for explicit Codex exec delegation; treat `$run-codex-exec` as the compatibility path for the old name. |
| Agent instructions | `$agents-md-maintainer` | Use when creating or updating `AGENTS.md` or `.local/AGENTS.md`. |

## Done means

- Relevant web and Rust checks were run, or skipped with a concrete reason.
- UI changes were checked in a live browser or Tauri window when behavior matters.
- The final response names changed files and validation results.
- If `.local/` is ever created, add `.local` to `.git/info/exclude`.
