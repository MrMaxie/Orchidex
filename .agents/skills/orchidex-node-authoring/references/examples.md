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
let cached = cache_get("codex/select-branch");
if cached != () {
  cached
} else {
  let response = freeze("codex/select-branch", payload);
  response
}
```

Do not call live Codex from tests unless the user explicitly enables recording for the fixture being updated.
