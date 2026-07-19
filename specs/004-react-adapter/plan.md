# Implementation Plan: React Survey Adapter

**Branch**: `004-react-adapter` | **Date**: 2026-07-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-react-adapter/spec.md`

## Summary

Add a reusable `@flowgraph/react` package that subscribes React 19 consumers to the
already implemented `FlowSession`, derives every survey decision through public core
selectors, supplies accessible default renderers and deterministic renderer overrides,
and coordinates ephemeral text/number drafts without adding keystroke events.

The package is client-only. It includes an injected browser-event-store integration
whose authoritative value is the event log and whose restore path ends in
`createSession(schema, events)`. The later `006-core-survey-demo` application will
compose this package into the styled psychology fixture; feature 004 does not build
that product-specific screen flow.

## Technical Context

**Language/Version**: TypeScript 5.9.3 in strict mode; Node.js 22 for tooling

**Primary Dependencies**: React 19.2.7 and React DOM 19.2.7 as peer dependencies;
`@flowgraph/core` and `@flowgraph/session` as workspace dependencies

**Storage**: No owned database or repository; optional injected browser `Storage`
adapter persists one JSON event log under an application-provided key

**Testing**: Vitest 4.1.10, jsdom 29.1.1, React Testing Library 16.3.2,
user-event 14.6.1, Playwright 1.61.1, axe 4.12.1, and a Vite 8.1.5 React harness

**Target Platform**: Client-rendered modern evergreen browsers; SSR and hydration are
out of scope

**Project Type**: Reusable React library inside the existing pnpm monorepo

**Performance Goals**: A committed local action is visible within 100 ms; one
successful session commit causes one external-store snapshot change; ordinary typing
does not dispatch per keystroke

**Constraints**: No survey semantics in React; public package-root imports only;
event-log restoration only; WCAG 2.2 AA baseline; ESM-only; 100% per-file coverage for
adapter source; no psychology-specific code

**Scale/Scope**: One session and one writer per mounted survey; four v1 question
presentations; kind and question-id renderer overrides; one retained browser event log
per configured storage key

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Gate | Pre-design | Post-design evidence |
|---|---|---|
| I. Functional Core, Effectful Shell | PASS | `@flowgraph/react` imports only public core/session contracts. Components invoke selectors and commands; they do not interpret graph semantics. Drafts, focus, and storage are explicitly shell effects. |
| II. Event sourcing is truth | PASS | `FlowSession.getSnapshot()` is the only observed projection. Persistence stores `getEvents()` and restore invokes governed replay through `createSession`. |
| III. Immutable event shape | PASS | The adapter accepts an injected `CommandMetaFactory`; it neither changes event envelopes nor generates domain identifiers. |
| IV. Closed semantics | PASS | Visibility, validation, active truth, edge choice, and progress come from public selectors and dispatch results. No guard evaluator is implemented in React. |
| V. Minimal governed kernel | PASS | No core primitive or event kind is added. Text references resolve only at presentation time. |
| VI. Validation as product | PASS | Existing fixture checks, probes, and goldens remain prerequisites. Adapter conformance uses those valid schemas without weakening validation. |
| VII. Test-first pure core | PASS | Core tests stay unchanged; adapter tests cover subscription, UI contracts, draft coordination, persistence failure, and browser accessibility. |
| Additional package boundaries | PASS | A dedicated package has DOM libraries; `flow-core` keeps ES2022-only libs. Dependency rules forbid adapter deep imports and application semantic imports. |

No constitutional exceptions or amendments are required.

## Project Structure

### Documentation (this feature)

```text
specs/004-react-adapter/
├── checklists/
│   └── requirements.md
├── contracts/
│   ├── accessibility.md
│   ├── persistence.md
│   ├── public-api.md
│   └── renderers.md
├── data-model.md
├── plan.md
├── quickstart.md
├── research.md
├── spec.md
└── tasks.md                 # Created by speckit-tasks, not this phase
```

### Source Code (repository root)

```text
packages/
├── flow-core/               # Existing governed pure engine
├── flow-session/            # Existing observable session
└── flow-react/
    ├── src/
    │   ├── types.ts
    │   ├── controller/
    │   │   ├── draft-registry.ts
    │   │   ├── friction.ts
    │   │   └── use-flow-survey.ts
    │   ├── hooks/
    │   │   ├── use-flow-state.ts
    │   │   └── use-flow-view.ts
    │   ├── persistence/
    │   │   ├── browser-event-store.ts
    │   │   └── persist-session.ts
    │   ├── renderers/
    │   │   ├── default-renderers.tsx
    │   │   ├── number-renderer.tsx
    │   │   ├── renderer-registry.ts
    │   │   ├── select-renderer.tsx
    │   │   └── text-renderer.tsx
    │   ├── view/
    │   │   ├── flow-page.tsx
    │   │   ├── problem-mapping.ts
    │   │   ├── problem-messages.tsx
    │   │   └── resolve-text.ts
    │   └── index.ts
    ├── test/
    │   ├── accessibility/
    │   ├── contract/
    │   ├── integration/
    │   ├── support/
    │   └── unit/
    ├── README.md
    ├── package.json
    ├── tsconfig.json
    └── tsconfig.test.json

test/
└── browser/
    ├── accessibility.spec.ts
    ├── adapter-harness.tsx
    ├── index.html
    ├── keyboard.spec.ts
    ├── main.tsx
    ├── performance.spec.ts
    ├── playwright.config.ts
    └── vite.config.ts
```

**Structure Decision**: use one new publishable adapter package rather than placing
React code in `flow-session` or the later demo. The package owns generic binding,
default controls, ephemeral UI coordination, and an injected persistence example.
Feature 006 will own branded layout and fixture composition in a separate application.

## Design Decisions

### External-store subscription

`useFlowState(session)` passes the stable session methods to React's external-store
subscription API. `FlowSession` already satisfies the required cached-snapshot
contract: the same snapshot reference is returned until a successful non-empty
dispatch. The client-only v1 hook does not provide a server snapshot.

### Derived view, not derived truth

`useFlowView(schema, session)` combines the observed snapshot with public core
selectors. Its output is presentation-shaped but contains no independent decisions.
The package may map problems to question identifiers and resolve text, because those
are presentation concerns; it may not evaluate guards or inspect edges.

### Commands and provenance

The host injects a `CommandMetaFactory` returning `at`, `source`, and `path`. Default
demo usage supplies human source and an empty v1 path. Injecting metadata keeps tests
deterministic and prevents the adapter from hard-coding provenance.

### Draft transaction ordering

Text and number renderers register dirty drafts with a controller-owned registry keyed
by question id and ordered by visible-question position. Blur flushes one draft.
Forward or backward navigation flushes all dirty drafts synchronously in stable order,
stopping on the first rejected answer. Only after every flush succeeds does the
controller dispatch navigation. A successful blur removes dirtiness, so the following
click cannot duplicate the answer.

### Friction and focus

Problems returned by rejected dispatches remain ephemeral React state. A relevant
successful answer clears that question's friction; successful navigation clears page
friction. After a rejected navigation, an effect focuses the first registered control
whose question id appears in stable problem order. No problem is appended to the event
log.

### Renderer precedence

Resolution is deterministic: question-id override, then question-kind override, then
the corresponding default renderer. Renderer props expose only question-facing data,
problems, resolved text, disabled state, and `onAnswer`; they do not expose the schema,
trail, graph edges, or other answers.

### Browser persistence

The browser store accepts a `StorageLike` object and application key. Saves serialize
the complete immutable event log after each committed batch, avoiding a second
snapshot format. Loads parse unknown JSON, upcast/parse events, and return structured
failures. Binding catches storage exceptions and reports them through a callback so a
committed in-memory session is never retried.

### Verification

Vitest covers every adapter source file at 100% statements, branches, functions, and
lines. React Testing Library exercises behavior through roles and labels. Playwright
validates actual-browser keyboard journeys, responsive focus behavior, and the
100-millisecond render-latency contract; axe checks automatable WCAG A/AA rules,
supplemented by a documented manual checklist. A second non-psychology fixture proves
that adapter behavior is not coupled to the first survey definition.

## Complexity Tracking

No constitution violations require justification.
