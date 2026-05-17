## 1. Node Execution Contract

- [ ] 1.1 Wire runtime node execution to `NodeRegistry` and Rhai entrypoints.
- [ ] 1.2 Implement host APIs for log, shell delegation, cache, freezer, timers, and Codex fixtures.
- [ ] 1.3 Return structured node outcomes with payload, routing, wait, block, fail, complete, and diagnostics data.

## 2. V1 Node Catalog

- [ ] 2.1 Implement and test `std/manual-ignite`, `std/transmute`, `std/accumulation`, `std/filter`, `std/merge`, and `std/manual-accept`.
- [ ] 2.2 Implement and test `debug/log`, `debug/placeholder-echo`, `debug/placeholder-rhai`, and `debug/note`.
- [ ] 2.3 Implement and test `std/sleep`, `std/cron`, `std/freezer`, `std/cache`, and `codex/exec`.

## 3. Authoring And Fixtures

- [ ] 3.1 Update the Orchidex node authoring skill with v1 Rhai host API and shell delegation examples.
- [ ] 3.2 Add fixture-first Codex and cache/freezer acceptance tests.
- [ ] 3.3 Run `cargo test --workspace` and `bun run core -- run-scenario`.
