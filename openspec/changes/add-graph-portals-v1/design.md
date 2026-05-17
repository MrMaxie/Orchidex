## Context

The baseline graph model has nodes and edges inside one graph. The requested v1 direction includes portals where one graph can trigger another graph through an entry portal and receive data back through an exit portal.

## Goals / Non-Goals

**Goals:**
- Make portals a full v1 capability.
- Preserve end-to-end spark traceability across graph boundaries.
- Allow graph composition without hiding which graph owns each step.
- Let users cancel or inspect portal-launched work.

**Non-Goals:**
- Do not build distributed multi-machine orchestration for v1.
- Do not make portals bypass manual gates or fixture policy.
- Do not require graphs to be embedded in one canvas to interact.

## Decisions

- A portal transfer creates a child spark or child run with a parent trace reference.
- Portal entry validates required payload shape before starting the target graph.
- Portal exit returns a JSON-compatible payload to the parent graph route.
- Cancellation propagates from parent to child and records which sparks were affected.
- The workspace shows portal boundaries and cross-graph trace links.

## Risks / Trade-offs

- Cross-graph recursion can be confusing -> Track depth and parent-child references, and block invalid recursive portal loops.
- Portal return payloads can mismatch expectations -> Validate entry and exit schema hints before transfer.
- Cancellation can leave partial work -> Persist cancellation diagnostics in both parent and child traces.
