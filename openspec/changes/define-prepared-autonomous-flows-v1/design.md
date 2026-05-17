## Context

The user wants a flexible runner that can automate repeated process management while still allowing them to direct work. The graph should encode prepared paths so routine decisions are handled by procedures, not by manual supervision each time.

## Goals / Non-Goals

**Goals:**
- Make graphs express prepared work procedures.
- Reduce repeated manual hygiene around acceptance criteria, code quality, verification, review, and follow-up.
- Keep manual control over destructive, credentialed, expensive, unclear, or policy-changing work.
- Use `clients-project` as the reference flow.

**Non-Goals:**
- Do not make agents autonomous without graph-authored policy.
- Do not bypass user approval for ambiguous or destructive actions.
- Do not run live Codex repeatedly in tests.

## Decisions

- Prepared flows are modeled as graphs and node configuration, not as hidden hardcoded orchestration.
- Codex prompts are generated from payload, graph context, node config, and explicit resources such as skills, subagents, fixtures, and acceptance criteria.
- Manual gates are first-class nodes and must appear before risky actions.
- Each run produces an inspectable report with work performed, decisions made, checks run, skipped checks, failures, and suggested next actions.
- The `clients-project` fixture represents real workflow shape using mocks and frozen outputs.

## Risks / Trade-offs

- Over-automation can hide poor decisions -> Keep trace, diagnostics, and manual gates visible.
- Prompt loops can waste model/API usage -> Use fixture-first tests, cache/freezer nodes, and explicit live-recording policy.
- Prepared paths can become stale -> Let flows update documented rules through manual review and versioned graph changes.
