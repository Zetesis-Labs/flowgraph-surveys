# Implementation Plan: Attachment Inputs

**Branch**: `007-attachment-inputs` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-attachment-inputs/spec.md`

## Summary

Add a first-class attachment question to the pure schema, answer, parser, validation,
replay, check, and probe surfaces. Represent answers only as serializable metadata.
Keep real files in an injected adapter-owned store and provide an accessible React
renderer for selection, listing, removal, and replacement without camera capture.

## Technical Context

**Language/Version**: TypeScript 5.9 in strict mode, Node.js 22+

**Primary Dependencies**: Zod 4 at parse boundaries; React 19 as an adapter peer

**Storage**: Event logs contain attachment metadata only; binary files use an in-memory
adapter store and have no governed persistence

**Testing**: Vitest 4, Testing Library, fast-check where event invariants apply, V8 coverage

**Target Platform**: Platform-independent pure core plus browser-capable React adapter

**Project Type**: pnpm monorepo of published libraries

**Performance Goals**: Attachment validation and replay remain linear in the bounded
number of references in an answer

**Constraints**: Core has no DOM, clock, randomness, or IO; strict wire formats; no
camera API or binary event content; exact 100% governed coverage

**Scale/Scope**: One new question kind, five new validation problems, one volatile
adapter store, and one default renderer

## Constitution Check

*GATE: Passed before research and re-checked after design.*

- **I — Functional Core, Effectful Shell**: PASS. The core sees readonly metadata;
  random ids and `File` objects remain in the React shell.
- **II — Event sourcing**: PASS. Attachment answers use the existing `ANSWERED` event;
  no event kind is introduced.
- **III — Immutable event shape**: PASS. Reference ids arrive from the shell and
  existing event versioning is unchanged.
- **IV — Closed semantics**: PASS. Visibility and active-truth rules apply unchanged.
- **V — Minimal kernel**: PASS. No guard or numeric-expression primitive is added.
- **VI — Validation ladder**: PASS. Parsing, `check()`, `probe()`, and structured
  problems all cover the new question.
- **VII — Test-first core**: PASS. Replay, parsing, validation, authoring, renderer,
  and store contracts are covered at exact 100%.

Post-design re-check: PASS. Binary lifecycle is explicitly excluded from core and
storage; public contracts preserve opaque shell-minted identity.

## Project Structure

### Documentation (this feature)

```text
specs/007-attachment-inputs/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── public-api.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
packages/flow-core/
├── src/
│   ├── domain/
│   ├── parsing/
│   ├── semantics/
│   ├── engine/
│   └── authoring/
└── test/
    ├── unit/
    ├── integration/
    └── support/

packages/flow-react/
├── src/
│   ├── attachments/
│   ├── renderers/
│   └── view/
└── test/
    ├── contract/
    ├── integration/
    └── support/
```

**Structure Decision**: Extend the existing governed core and React adapter in place.
No new package is needed because metadata semantics belong to the core and binary
lifecycle belongs to the existing presentation adapter.

## Complexity Tracking

No constitution violations or exceptional complexity are required.
