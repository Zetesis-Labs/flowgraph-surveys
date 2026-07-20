# Quickstart: Composable Schema Packs

## Validation flow

1. Create concrete packs or call pure typed pack factories.
2. Give every use a unique instance id.
3. Connect named outlets to named entries.
4. Compile the composition.
5. Run the existing checker, probe, and goldens against the resulting schema.
6. Serialize the resulting schema as the single form JSON.

## Automated validation

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm boundaries
pnpm build
pnpm test:coverage
pnpm package:check
```

Expected result:

- Parsing and independent pack checking pass.
- Valid compositions produce ordinary schemas with deterministic namespaced ids.
- Invalid compositions return complete stable problem collections and no partial schema.
- Repeated-pack, property, scale, checker, probe, and golden tests pass.
- Governed coverage remains exactly 100%.
