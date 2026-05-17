## Why

Orchidex is intended to reduce repeated task management without taking ownership away from the user. v1 needs prepared autonomous flows where graph-authored procedures handle hygiene, acceptance checks, task decomposition, review loops, and Codex prompting while the user remains the task boss.

## What Changes

- Define boss-controlled autonomy as a first-class v1 capability.
- Specify graph-authored procedures for repeated development work: intake, queueing, branch selection, task decomposition, implementation loops, verification, review, and rule updates.
- Require manual gates for destructive actions, credential-sensitive work, unclear acceptance, and live Codex fixture recording.
- Extend `clients-project` into the canonical acceptance scenario for prepared autonomous flows.

## Capabilities

### New Capabilities
- `prepared-autonomous-flows`: Boss-controlled autonomous graph procedures for repeatable technical work.
- `prepared-flow-gates`: Manual gate policy for destructive, credential-sensitive, unclear, expensive, or live-recording actions.
- `prepared-flow-reporting`: Inspectable run reports for automated graph procedures.

### Modified Capabilities
- `fixture-clients-project`: Extend `clients-project` into the canonical prepared flow scenario.
- `fixture-codex-policy`: Preserve fixture-first Codex execution inside autonomous flow tests.
- `validation-commands`: Make validation command execution and skipped-check reporting part of prepared flow acceptance.
- `agent-node-authoring-skill`: Include skill/subagent resource references in prepared prompt construction.

## Impact

- Affects graph examples, fixtures, node catalog usage, Codex prompt conventions, skill/subagent delegation policy, acceptance checks, and run reporting.
- Does not make Orchidex a fully independent orchestrator; user decisions remain explicit where risk or ambiguity is high.
