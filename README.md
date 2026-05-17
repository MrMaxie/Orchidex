<p align="center">
  <img src="./public/logo.png" alt="Orchidex logo" width="120" />
</p>

# Orchidex

Orchidex is a graph workspace for shaping ideas, flows, and connected systems across desktop and web.
It is designed to feel visual, focused, and native to technical workflows without turning into a noisy canvas.

## What It Is

Orchidex explores a simple premise: graph-based work should feel precise enough for developers and clear enough for anyone organizing a system, process, or concept. The current project sets up that workspace as a Tauri desktop app with a matching web target.

## Available Today

- An interactive graph canvas powered by ReactFlow
- A desktop shell configured with Tauri
- A web target served through Vite
- A first-pass visual system with Orchidex branding, Dosis for UI text, and Fira Code for technical surfaces

## Why Orchidex

- It keeps graph work spatial and direct instead of burying structure in nested forms.
- It aims for the same workspace to feel natural on desktop and in the browser.
- It builds toward a polished graph environment with a distinct visual identity, not a generic node editor.

## Quick Start

```bash
bun install
bun run dev
```

Run the desktop shell:

```bash
bun tauri dev
```

Build the web target:

```bash
bun run build
```

## Project Status

Orchidex is currently establishing its core workspace foundation. The graph surface, desktop shell, web runtime, and visual direction are in place, and the project is moving toward a fuller graph experience without overpromising features that are not implemented yet.

## For Developers

The repo uses Bun for frontend workflows and Tauri for the desktop shell. For current engineering expectations, commands, and project conventions, see [`AGENTS.md`](./AGENTS.md).
