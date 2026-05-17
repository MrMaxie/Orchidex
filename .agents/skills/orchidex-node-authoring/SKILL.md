---
name: orchidex-node-authoring
description: Create, review, or update Orchidex node folders. Use when working with nodes under the nodes directory, node.toml manifests, main.rhai entrypoints, Rhai payload transforms, host APIs, shell delegation to Bun/Node/Python/Codex, cache/freezer behavior, or mock fixture-first node execution.
---

# Orchidex Node Authoring

Create nodes as folder-scoped runtime units. Each folder is one node and must contain:

```text
nodes/<namespace>/<name>/
  node.toml
  main.rhai
```

## Workflow

1. Read the target `node.toml` and `main.rhai`.
2. Preserve the node id as `<namespace>/<name>` unless the user explicitly renames it.
3. Keep payloads JSON-compatible for v1.
4. Prefer Rhai transforms for in-process work and shell delegation only when another runtime is required.
5. For Codex-backed behavior, use fixtures by default and require explicit opt-in before recording a live Codex response.
6. Run `cargo test --workspace` after changing core node contracts or runtime behavior.

## Manifest

Use `node.toml` for metadata:

```toml
id = "std/transmute"
label = "Transmute"
description = "Runs Rhai to transform an incoming spark payload into an outgoing payload."
entrypoint = "main.rhai"
capabilities = ["rhai", "transform"]

[config_schema.script]
type = "string"
description = "Rhai expression or script used to transform payload."
```

Required fields are `id`, `label`, `description`, and `entrypoint`. Schema tables are JSON-schema-like hints for UI generation; keep them simple and serializable.

When a node needs stable routing, declare explicit port definitions in `node.toml` so runtime and UI can validate edge handles consistently:

```toml
[[input_ports]]
id = "in"
label = "Input"
direction = "input"
cardinality = "one"

[[output_ports]]
id = "approved"
label = "Approved"
direction = "output"
cardinality = "many"
```

If a legacy/simple node omits port definitions entirely, Orchidex assigns deterministic default ports `in` and `out`. Use explicit port blocks when you want anything else.

## Rhai Entrypoint

`main.rhai` receives `payload` and returns the outgoing payload. Return `()` when the node has no output.

Useful host functions:

- `log(message)` writes a runtime log event or console line.
- `shell(command)` delegates to a command line tool and returns a string result.
- `cache_get(key)` and `cache_set(key, value)` implement repeatable cache nodes.
- `freeze(key, value)` stores permanent fixture-like output for freezer nodes.
- `schedule_after_ms(delay_ms, value)` returns a delayed payload for scheduler nodes.
- `codex_fixture(path)` loads a frozen Codex response from disk and must be preferred over live Codex in tests.

Rhai nodes may also return structured outcome maps instead of plain payloads:

```rhai
#{
  status: "wait",
  payload: payload,
  route: "approved",
  wait: #{
    delayMs: 250,
    reason: "manual review window"
  },
  diagnostics: ["waiting for approval"]
}
```

See `references/examples.md` for concrete Rhai patterns.
