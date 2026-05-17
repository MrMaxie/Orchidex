## 1. Prepared Flow Contracts

- [ ] 1.1 Define payload conventions for intake, work items, acceptance criteria, verification results, review feedback, and final reports.
- [ ] 1.2 Define manual-gate policy for destructive, credential-sensitive, unclear, expensive, and live-recording actions.
- [ ] 1.3 Define run reporting and trace requirements for autonomous decisions.

## 2. Clients Project Scenario

- [ ] 2.1 Expand the `clients-project` fixture graph for manual/mail intake, accumulation, gates, branch selection, task splitting, work loop, tests, review, and reporting.
- [ ] 2.2 Add frozen Codex fixture outputs for branch selection and task decomposition.
- [ ] 2.3 Add mock mail/Jira/PR inputs and expected work-stack outputs.

## 3. Validation

- [ ] 3.1 Add fixture acceptance tests for the prepared flow without repeated live Codex calls.
- [ ] 3.2 Verify manual gate behavior for risky or unclear actions.
- [ ] 3.3 Run `bun run core -- run-scenario`, `cargo test --workspace`, and `bun run check`.
