# Implementation Plan: Composable Schema Packs

**Branch**: `008-schema-packs` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-schema-packs/spec.md`

## Summary

Introduce concrete authoring-time packs with array-based named entries and outlets,
collision-free instances, ordered cross-pack connections, strict parsing, independent
validation, and a pure compiler. Compilation rewrites all schema identities and
references and returns the ordinary `FlowSchema` already understood by every runtime
surface.

## Technical Context

**Language/Version**: TypeScript 5.9 strict mode, Node.js 22+

**Primary Dependencies**: Existing pure FlowGraph core; Zod 4 only at pack/composition
parse boundaries

**Storage**: N/A; concrete packs, compositions, and compiled schemas are plain JSON data

**Testing**: Vitest 4, fast-check 4, existing checker/probe/golden runner, V8 coverage

**Target Platform**: Platform-independent pure library

**Project Type**: pnpm monorepo, extending `@flowgraph/core`

**Performance Goals**: Compile 20 packs and 500 nodes under one second; prove 100
instances collision-free

**Constraints**: No IO, global registry, mutation, DOM, clock, or randomness; deterministic
error aggregation; no pack constructs in compiled output; exact 100% coverage

**Scale/Scope**: Concrete resolved packs and typed pure factories; cycles, recursion,
runtime loading, registries, and repeatable instances remain out of scope

## Constitution Check

*GATE: Passed before research and re-checked after design.*

- **I — Functional Core**: PASS. Pack validation and compilation are pure total functions.
- **II/III — Event sourcing and immutable events**: PASS. Packs compile before session
  creation and add no command or event kinds.
- **IV — Closed semantics**: PASS. Compilation emits the existing schema grammar and the
  existing checker retains authority over cycles and well-foundedness.
- **V — Minimal kernel**: PASS. No guard or numeric-expression primitive is introduced.
- **VI — Validation ladder**: PASS. Packs get structured validation; compiled output
  runs through `check()`, `probe()`, and ordinary goldens.
- **VII — Test-first core**: PASS. Parsing, mapping, diagnostics, properties, scale, and
  golden execution are governed at exact 100%.

Post-design re-check: PASS. Namespacing is authoring-only, event format is unchanged,
and concrete factory output is data rather than executable runtime configuration.

## Project Structure

### Documentation (this feature)

```text
specs/008-schema-packs/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── pack-format.md
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
│   │   ├── ids.ts
│   │   └── pack.ts
│   ├── parsing/
│   │   ├── schema.ts
│   │   └── pack.ts
│   └── authoring/
│       └── compose.ts
└── test/
    ├── unit/
    │   └── pack-parsing.test.ts
    ├── integration/
    │   └── pack-composition.test.ts
    ├── property/
    │   └── pack-composition.property.test.ts
    └── support/
        └── packs.ts
```

**Structure Decision**: Pack domain, parsing, validation, and compilation remain in the
existing pure core because they are horizontal authoring semantics. A separate runtime
package would duplicate schema execution and violate the single-kernel design.

## Complexity Tracking

No constitution violations require justification.
