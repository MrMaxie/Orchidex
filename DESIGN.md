# Orchidex Design System

| Field | Value |
| --- | --- |
| Status | Draft |
| Created | 2026-05-17 |
| Last Updated | 2026-05-17 |
| Product | Orchidex |
| Platform | Tauri desktop app and Vite web app |
| Primary audience | Developers, AI builders, technical founders, and power users |

## Context

Orchidex is a developer application for graph-based work across web and desktop. The interface should feel native to developer workflows: dense enough for repeated use, precise in controls, and visually memorable without becoming decorative.

The current brand direction is based on the Orchidex logo in `public/logo.png`: a luminous orchid emblem with strong midnight-violet outlines, layered lavender and magenta petals, porcelain highlights, and electric-aqua accents. This mark is the identity anchor. Future UI, documentation, and app surfaces should support the existing mark instead of replacing it with a new abstract symbol.

## Problem Statement

The product needs a stable design baseline before the UI expands beyond the starter graph workspace. Without a shared design direction, new screens can drift into generic dark SaaS styling, inconsistent developer-tool conventions, or unrelated color treatments.

This document defines the visual system contracts that should guide implementation:

- How the Orchidex logo should influence app surfaces.
- Which colors and typography are authoritative.
- How graph, terminal, command, and code surfaces should feel.
- What visual patterns should be avoided as the product grows.

## Goals

- Establish Orchidex as a vibrant dark developer tool, not a generic purple AI app.
- Preserve the existing orchid logo as the main symbol across app icon, header, empty states, documentation, and brand materials.
- Use Dosis Variable for GUI typography and Fira Code Variable for code, terminal, IDs, and command surfaces.
- Make graph workflows feel precise, luminous, and spatially clear.
- Keep the interface usable for long technical sessions through strong contrast, restrained motion, and predictable layout.

## Non-Goals

- This document does not define final product information architecture.
- This document does not replace implementation specs for graph editing, persistence, collaboration, or Tauri commands.
- This document does not require every UI surface to use heavy gradients or large logo imagery.
- This document does not introduce a new logo concept.

## Brand Direction

Orchidex should combine two ideas:

- **Bloom**: creation, branching, emergence, and visual distinctiveness.
- **Dexterity**: precise control, developer speed, graph manipulation, and technical confidence.

The brand should feel like a polished developer workspace with a vivid identity layer. It can borrow the clarity of modern documentation products and coding tools, but its color and logo treatment should be more saturated and ownable.

Recommended tagline for brand explorations:

> Build in bloom.

## Logo System

Primary logo reference: `public/logo.png`.

Usage principles:

- Use the existing orchid emblem as the canonical product mark.
- Preserve the strong dark contour, layered petal geometry, porcelain highlights, lavender-purple glow, and electric-aqua accent points.
- Prefer simplified logo crops for small UI use instead of redrawing the mark from scratch.
- Use the full emblem in app launch, about, onboarding, marketing, and larger empty states.
- Use a simplified icon tile in dense headers, tabs, sidebars, and graph node badges.

Avoid:

- Replacing the orchid with a generic node graph icon.
- Flattening the mark so far that it loses the petal silhouette.
- Using unrelated mascot, animal, shield, spark, or lightning symbols.
- Placing the logo on low-contrast purple backgrounds where the outline disappears.

## Color System

The following colors are the source of truth for the Orchidex identity:

| Token | Hex | Role |
| --- | --- | --- |
| `--midnight-violet` | `#0E0325` | Primary app background, shell chrome, deep panels |
| `--lavender-purple` | `#AC6BF1` | Primary brand accent, active states, graph highlights |
| `--electric-aqua` | `#91F0FC` | Secondary accent, focus states, data glow, edge emphasis |
| `--porcelain` | `#FBFEFB` | Primary text on dark surfaces, highlight strokes |

Supporting guidance:

- Use midnight violet as the dominant surface color.
- Use lavender purple for primary affordances and active graph states.
- Use electric aqua for focus, live status, selected edges, and technical signals.
- Use porcelain for high-contrast text, logo highlights, and key dividers.
- Small magenta transitions are acceptable when they come from the existing logo lighting.

Avoid:

- Generic blue-purple gradient washes.
- One-note purple surfaces without aqua or porcelain contrast.
- Beige, sand, brown, or corporate navy palettes.
- Random rainbow graph colors unless a feature explicitly requires categorical color mapping.

## Typography

Orchidex uses two variable font families:

| Use | Package | CSS family |
| --- | --- | --- |
| GUI typography | `@fontsource-variable/dosis` | `"Dosis Variable"` |
| Code, terminal, IDs, command bars | `@fontsource-variable/fira-code` | `"Fira Code Variable"` |

### GUI Font

Dosis Variable should be used for the application shell, headings, buttons, tabs, panels, forms, graph labels, and standard UI copy.

Recommended weight range:

- `400`: body and secondary labels.
- `500`: navigation and compact controls.
- `600`: panel titles, selected states, and graph node labels.
- `700`: hero or empty-state headings.

### Monospace Font

Fira Code Variable should be used for:

- Code snippets.
- Terminal surfaces.
- Prompt inputs and command palettes when command syntax is shown.
- Node IDs, edge IDs, file paths, model names, environment keys, and compact technical metadata.

Recommended weight range:

- `400`: code and terminal text.
- `500`: command labels and inline technical chips.
- `600`: selected code tokens or important metadata.

## UI Surface Principles

Orchidex should be an operational tool first. The first screen should expose the usable graph workspace, not a marketing landing page.

Core layout rules:

- Prefer full-height work surfaces with restrained chrome.
- Keep graph canvases unframed or lightly framed; avoid nested card layouts.
- Use compact toolbars and icon buttons for repeated actions.
- Make panes independently scrollable when content can overflow.
- Use stable dimensions for graph controls, minimaps, command bars, tabs, and node cards.
- Keep animation subtle: edge pulses, selection glow, live status shimmer, and panel transitions are enough.

## Component Direction

### App Shell

- Dark midnight-violet base.
- Thin porcelain dividers at low opacity.
- Lavender active navigation states.
- Electric-aqua focus ring for keyboard and graph interaction.
- Logo icon in the header or sidebar should be visible but not oversized.

### Graph Canvas

- Canvas background should feel spatial and technical: subtle grid, radial glow, or low-contrast node field.
- Graph edges can use lavender for normal emphasis and electric aqua for selected or live states.
- Node bodies should remain readable on dark surfaces and avoid excessive blur.
- Important nodes can borrow the petal construction idea: layered border, inner glow, or pointed accent notch.

### Command And Code Surfaces

- Use Fira Code Variable.
- Keep prompt bars visually crisp, not chatty.
- Use porcelain text on midnight-violet surfaces.
- Reserve electric aqua for cursor, focus, and execution status.
- Use lavender for suggestions, selected commands, and highlighted graph references.

### Empty States

- Use the orchid logo or a simplified petal/node motif.
- Keep copy short and action-oriented.
- Avoid long explanatory paragraphs inside the product UI.

## Accessibility

- All primary text on midnight violet should use porcelain or a high-contrast near-white.
- Lavender and aqua accents should not carry meaning alone; pair with shape, label, or state.
- Focus states must be visible on dark and vibrant surfaces.
- Avoid thin text below `400` weight for functional UI.
- Avoid placing small text directly on complex logo or image crops.

## Implementation Notes

Installed packages:

- `@fontsource-variable/dosis`
- `@fontsource-variable/fira-code`

Global CSS should import both packages before app styles and define these font stacks:

```css
:root {
  --font-gui: "Dosis Variable", "Segoe UI Variable", "Segoe UI", sans-serif;
  --font-code: "Fira Code Variable", "Cascadia Code", "Consolas", monospace;
}
```

The application should use `--font-gui` by default and apply `--font-code` to `code`, `pre`, `kbd`, `samp`, command bars, and terminal-like surfaces.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Logo detail does not scale to small UI sizes | Header and tray/icon use may become muddy | Define simplified icon crops for small sizes |
| Vibrant palette becomes visually tiring | Long developer sessions suffer | Keep midnight violet dominant and use accent colors sparingly |
| Dosis feels too soft for technical density | UI may lose developer-tool precision | Pair with Fira Code for technical surfaces and use medium weights for controls |
| Aqua and lavender overuse reduces hierarchy | Important states become hard to scan | Reserve aqua for focus/live/selected technical signals |

## Validation Checklist

- The logo in `public/logo.png` remains the visual anchor.
- GUI text uses Dosis Variable.
- Code and terminal text use Fira Code Variable.
- The main surface reads as a developer workspace, not a landing page.
- Graph states have clear contrast and do not rely only on color.
- Accent colors are vibrant but sparse.
- UI text remains readable on desktop and mobile web targets.

## Open Questions

- Should the app use the full orchid emblem in the main shell or only in launch/about surfaces?
- What simplified small-size icon should be derived from `public/logo.png`?
- Should graph node categories receive additional semantic colors, or should V1 stay within the four-color brand palette?
- Should the first production UI include a command palette as a primary surface or keep it secondary to the graph canvas?
