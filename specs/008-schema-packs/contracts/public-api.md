# Public API Contract: Schema Packs

The core exports:

- Branded pack, instance, and port ids with conversion helpers.
- Concrete pack, entry, outlet, instance, connection, composition, problem, and factory types.
- Strict `parsePack` and `parseComposition` boundaries.
- `checkPack(pack)` for independent diagnostics.
- `compileComposition(composition)` returning `Result<FlowSchema, problems>`.
- Pure namespace helpers for inspecting compiled ids in tests and authoring tools.

Behavioral guarantees:

- No function mutates pack or composition input.
- Identical input produces deeply equal results.
- Problems are stable and returned in deterministic discovery order.
- Compilation aggregates independent errors and returns no schema when any error exists.
- Successful output contains only the existing `FlowSchema` shape.
- The existing `check`, `probe`, session, replay, and golden APIs require no pack awareness.
