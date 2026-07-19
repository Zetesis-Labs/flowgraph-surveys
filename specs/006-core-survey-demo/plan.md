# Implementation Plan: Core Survey Demo

**Branch**: `006-core-survey-demo` | **Date**: 2026-07-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-core-survey-demo/spec.md`

## Summary

Build a polished, local-only respondent experience that makes the complete FlowGraph
v1 behavior tangible through a fictional psychology intake fixture. The expanded
fixture directly exercises every governed guard and numeric expression through neutral
logistical follow-ups while keeping all scores undisclosed and non-clinical. The application
uses React 19, Vite, and Tailwind CSS 4; it consumes only the public APIs of
`@flowgraph/core`, `@flowgraph/session`, and `@flowgraph/react`. The core remains the
sole owner of routing, active truth, validation, progress, replay, and completion.
The shell owns presentation, event timestamps, local persistence, and recovery UI.

## Technical Context

**Language/Version**: TypeScript 5.9, Node.js 22, React 19.2  
**Primary Dependencies**: Vite 8, Tailwind CSS 4.3, `@tailwindcss/vite`,
`@flowgraph/core`, `@flowgraph/session`, `@flowgraph/react`  
**Storage**: One versioned event envelope in browser `localStorage`; no server  
**Testing**: Vitest, Testing Library, Playwright, Axe, engine check/probe/goldens  
**Target Platform**: Modern evergreen browsers, phone and desktop viewports  
**Project Type**: Local single-page web application in the pnpm monorepo  
**Performance Goals**: Interactive transition feedback under 100 ms; production
bundle under 250 KiB gzip excluding source maps  
**Constraints**: Fully local, no accounts, no network at runtime, no clinical
assessment, no duplicated domain logic, accessible keyboard-first behavior  
**Scale/Scope**: One retained session, one replaceable fixture, three consultation
routes, three logistical subroutes, two reconvergence layers, introduction and
completion states

## Constitution Check

*GATE: Passed before Phase 0 and re-checked after Phase 1.*

- **I — Functional core/effectful shell**: PASS. The app delegates every semantic
  decision to the existing core/session/React packages. Browser effects live under
  `src/session` and `src/app`.
- **II/III — Event sourcing and immutable events**: PASS. Only the versioned event
  envelope is persisted; restore calls `createSession(schema, events)`.
- **IV — Closed semantics**: PASS. Conditional visibility references only preceding
  questions and ordered guards are authored in the fixture.
- **V — Minimal kernel**: PASS. The demo introduces no new expression or event kind.
- **VI — Validation product**: PASS. Fixture acceptance requires zero structural and
  probe problems and 100% engine-measured transition coverage from goldens.
- **VII — Test-first**: PASS. Route, correction, replay, persistence, completion,
  accessibility, and responsive journeys are specified as executable tests.
- **Additional constraints**: PASS. Strict TypeScript, pnpm workspace, immutable
  question ids, and no schema/session migration.

## Project Structure

### Documentation (this feature)

```text
specs/006-core-survey-demo/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── accessibility.md
│   ├── fixture.md
│   ├── persistence.md
│   └── ui.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/survey-demo/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── app/
│   │   ├── app.tsx
│   │   └── use-demo-session.ts
│   ├── components/
│   │   ├── completion-screen.tsx
│   │   ├── confirm-dialog.tsx
│   │   ├── intro-screen.tsx
│   │   ├── survey-screen.tsx
│   │   └── visual-shell.tsx
│   ├── fixture/
│   │   ├── goldens.ts
│   │   ├── schema.ts
│   │   └── verify.ts
│   ├── renderers/
│   │   └── short-text-renderer.tsx
│   ├── session/
│   │   └── browser-session.ts
│   ├── main.tsx
│   └── styles.css
└── test/
    ├── app.test.tsx
    ├── fixture.test.ts
    └── session.test.ts

test/demo-browser/
├── demo.spec.ts
└── playwright.config.ts
```

**Structure Decision**: A standalone workspace application proves that the published
package surfaces are sufficient for a consumer. App-specific presentation and
persistence orchestration stay outside reusable packages; browser journeys remain in
the repository-level acceptance suite.

## Design Decisions

1. `FlowPage` remains the semantic renderer and receives an ID-specific short-text
   renderer. Tailwind component layers style its semantic HTML without teaching the
   adapter about this fixture.
2. A single `DemoSessionHost` creates/restores/replaces the mutable session and
   remounts the React controller on replacement.
3. Introduction state is presentation-only. Starting emits the governed
   `SESSION_STARTED` command through `useFlowSurvey`; completion is derived from the
   core state.
4. Persistence failures never disable the in-memory survey. They produce a visible
   warning; corrupt stored content produces a recovery screen and requires an
   explicit new start.
5. The fixture has reason-routing pages for sleep, stress, and life change, then
   reconverges on contact preferences. Route correction is normal back navigation;
   active truth excludes abandoned answers while the event log retains them.
6. A shared adaptation page asks bounded scheduling capacity, weighted interaction
   preferences, and an optional specific request. Ordered edges select a request,
   spacious-capacity, or focused-capacity follow-up, then reconverge on final context.
7. The request edge exercises `answered`; the spacious edge composes `all`, `cmp`,
   `sum`, `answer`, `score`, and `num`; the focused edge composes `any`, `not`, and
   comparisons. Existing route selection exercises `selected`, and reconvergence
   exercises `always`.
8. Fixture verification inventories the expression tree in addition to check, probe,
   goldens, and engine-measured transition coverage. A missing governed primitive
   fails acceptance before the app starts.

## Complexity Tracking

No constitutional violations require justification.
