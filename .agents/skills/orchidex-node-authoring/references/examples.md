# Orchidex Node Examples

## Echo

```rhai
payload
```

## Transform

```rhai
payload["summary"] = `${payload["source"]} accepted`;
payload
```

## Delegate To Bun

```rhai
let result = shell("bun run scripts/normalize-payload.ts");
payload["normalized"] = result;
payload
```

## Fixture-First Codex

```rhai
let fixture = codex_fixture("examples/fixtures/clients-project/codex-select-branch.json");
#{
  payload: #{
    input: payload,
    response: fixture["response"],
    fixture: "examples/fixtures/clients-project/codex-select-branch.json"
  },
  diagnostics: ["fixture-first codex execution"]
}
```

Do not call live Codex from tests unless the user explicitly enables recording for the fixture being updated.

## Explicit Wait Outcome

```rhai
#{
  status: "wait",
  payload: payload,
  wait: #{
    delayMs: 1000,
    reason: "cooldown"
  },
  diagnostics: ["sleep node delayed spark"]
}
```
