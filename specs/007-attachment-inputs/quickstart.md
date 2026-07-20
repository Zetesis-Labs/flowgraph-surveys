# Quickstart: Attachment Inputs

## Prerequisites

- Node.js 22+
- pnpm 10
- Workspace dependencies installed

## Validation

Run the complete governed validation:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm boundaries
pnpm build
pnpm test:coverage
```

Expected result:

- Strict attachment schemas and answers round-trip successfully.
- Invalid counts, types, sizes, duplicates, and required input return distinct problems.
- Replay and active truth remain deterministic.
- The React store and renderer lifecycle passes contract and integration tests.
- Statement, branch, function, and line coverage are all exactly 100%.

## Manual contract inspection

Confirm that the public surface and binary boundary match
[contracts/public-api.md](./contracts/public-api.md), then verify no vertical-specific
fixture or copy appears in the attachment implementation:

```bash
rg -n -i "garment|prenda|naiz|fitting" packages/flow-core packages/flow-react
```

The search must return no results.
