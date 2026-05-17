## Context

The repository already contains enough implementation surface that a four-spec baseline hides important responsibilities. Current state and expected v1 state need different OpenSpec locations:

- `openspec/specs/` describes what exists now and is currently true.
- `openspec/changes/*/specs/` describes expected v1 deltas that are not implemented yet.

## Goals / Non-Goals

**Goals:**
- Create a more precise current-state baseline.
- Keep specs grouped by responsibility and implementation boundary.
- Make later active changes easier to validate and apply.

**Non-Goals:**
- Do not archive v1 expected changes.
- Do not implement runtime, node, UI, portal, or autonomous-flow code.
- Do not remove the earlier archived baseline; it remains audit history.

## Decisions

- Use many small capability specs rather than a few broad specs.
- Each current-state spec documents observed behavior and known limitations.
- Active v1 changes will be retargeted to these granular capabilities after this baseline is archived.

## Risks / Trade-offs

- More specs require more upkeep -> The split follows stable ownership boundaries so future changes can update only the affected capability.
- Some broad specs remain -> They are kept as archived baseline context while new specs carry detailed responsibility-level requirements.
- Current and expected state can be confused -> Use `openspec/specs/` for current state and active changes for expected v1 state.
