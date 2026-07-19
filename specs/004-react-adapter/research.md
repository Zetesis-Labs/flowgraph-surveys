# Phase 0 Research: React Survey Adapter

**Feature**: `004-react-adapter`
**Date**: 2026-07-19
**Status**: Complete — no unresolved technical clarifications

## 1. React subscription boundary

**Decision**: implement the session binding with `useSyncExternalStore`, using
`session.subscribe` and `session.getSnapshot` directly.

**Rationale**: React defines this hook specifically for external mutable stores. Its
contract requires subscription cleanup and a cached immutable snapshot. Feature 001
already guarantees both reference stability and synchronous notification after commit.
The adapter therefore needs no mirrored React-owned session state.

**Alternatives considered**:

- Context plus `useState`: rejected because it duplicates the authoritative snapshot
  and creates synchronization paths.
- Event subscription plus local reducer: rejected because it reimplements projection
  outside the governed core.
- State-management library: rejected because the session already is the external
  store and another dependency adds no capability.

**Source**: <https://react.dev/reference/react/useSyncExternalStore>

## 2. Client-only v1

**Decision**: omit a server-snapshot contract and explicitly reject SSR/hydration as a
v1 requirement.

**Rationale**: the first consumer is a local browser demo with browser persistence.
Supporting server snapshots would require defining cross-environment session creation,
event transfer, and hydration equality that the feature does not use.

**Alternatives considered**:

- Optional server snapshot in v1: rejected because an apparently available API without
  a complete hydration contract would be misleading.
- Full SSR demo: rejected as outside the local, offline respondent scope.

## 3. React and toolchain versions

**Decision**: target React/React DOM 19.2.7 with TypeScript 5.9.3 and keep React as a
peer dependency of `@flowgraph/react`.

**Rationale**: the monorepo already governs TypeScript 5.9.3. A peer dependency avoids
shipping a second React instance and lets consuming applications own their React
runtime. The versions were checked from the public package registry on 2026-07-19.

**Alternatives considered**:

- Bundle React as a production dependency: rejected because libraries must not create
  duplicate React runtimes.
- Add a compatibility matrix for multiple React majors: deferred until a second real
  consumer requires it.

## 4. Drafted text and number input

**Decision**: keep text and number edits in local component state and commit on blur
or before navigation; commit selects immediately.

**Rationale**: every confirmed answer is an immutable event. Dispatching on every
keystroke produces noisy provenance and repeated storage writes. Explicit save buttons
make ordinary form entry cumbersome. A coordinated flush preserves the last deliberate
edit before navigation while leaving partially typed input intentionally ephemeral.

**Alternatives considered**:

- Dispatch per input event: rejected due to event-log and persistence amplification.
- Debounced dispatch: rejected because timers introduce ambiguous interruption and
  ordering semantics.
- Per-field Save button: rejected because it harms respondent flow and keyboard
  efficiency.

## 5. Default and custom renderers

**Decision**: ship accessible defaults for all four v1 presentations and resolve
overrides by question id, then kind, then default.

**Rationale**: the demo needs a complete UI, while other products need visual
customization. A small renderer contract prevents custom components from seeing graph
state and becoming a second semantic engine. Identifier precedence supports bespoke
widgets without replacing all questions of the same kind.

**Alternatives considered**:

- No default renderers: rejected because it would leave the demo to rebuild basic
  accessible controls.
- Render-prop for the entire survey: rejected because it exposes too much state and
  weakens the boundary.
- Identifier-only registry: rejected because common product-wide treatments would be
  repetitive.

## 6. Behavioral component testing

**Decision**: use React Testing Library and user-event on jsdom for package behavior,
querying through roles, labels, and visible messages.

**Rationale**: Testing Library recommends tests that resemble user interaction rather
than component internals. Those queries also expose missing accessible names and
relationships early.

**Alternatives considered**:

- Snapshot-heavy component tests: rejected because markup snapshots are brittle and
  do not demonstrate keyboard or form behavior.
- Enzyme-style instance inspection: rejected because it couples tests to component
  structure.

**Sources**:

- <https://testing-library.com/docs/react-testing-library/intro/>
- <https://testing-library.com/docs/user-event/intro/>

## 7. Browser and accessibility verification

**Decision**: run primary end-to-end contracts in Playwright Chromium, use axe for
automatable WCAG 2.2 A/AA findings, and retain a manual keyboard/screen-reader checklist.

**Rationale**: Playwright supplies isolated browser contexts, role-based locators, and
web-first assertions. Its accessibility guidance explicitly notes that automated
scans find only a subset of issues, so automation cannot replace manual verification.
Chromium is sufficient for the adapter contract; cross-browser product validation can
be added with feature 006 if required.

**Alternatives considered**:

- jsdom only: rejected because focus, browser form behavior, and responsive layout need
  a real browser.
- Three-browser matrix in the package: deferred because it increases CI cost without
  a stated compatibility requirement.
- Axe only: rejected because keyboard flow and screen-reader clarity require manual
  checks.

**Sources**:

- <https://playwright.dev/docs/intro>
- <https://playwright.dev/docs/accessibility-testing>
- <https://playwright.dev/docs/best-practices>

## 8. Browser event-log persistence

**Decision**: provide a storage-agnostic browser event-store helper with injected
`StorageLike`, save the complete log under one application key, and report failures
without throwing from a session listener.

**Rationale**: one complete JSON write is atomic at the application-key level and
avoids partial batch append recovery. The event log remains the only truth. Injecting
storage enables deterministic tests for quota, unavailable storage, corrupt JSON, and
replacement.

**Alternatives considered**:

- Persist snapshots: rejected by the constitution because snapshots are caches.
- Append separate localStorage keys per event: rejected because partial multi-key
  updates complicate ordering and cleanup.
- IndexedDB: rejected for a one-session v1 demo whose event volume is small.

## 9. Development bundler

**Decision**: the adapter package is built by TypeScript project references. Feature
004 uses Vite only to serve its real-browser test harness; feature 006 will use Vite
for the local React application.

**Rationale**: the library needs declarations and ESM output, already provided by the
monorepo build. The Playwright harness still needs a browser-served React entry point,
for which Vite's official React integration is appropriate. Vite performs
transpilation rather than type checking, so the existing `tsc -b` gate remains
authoritative.

**Alternatives considered**:

- Bundle the library with Vite: rejected because a closed ESM package with TypeScript
  output needs no application bundling.
- Create the demo in this feature: rejected by the agreed feature dependency
  `001 → 004 → 006`.

**Sources**:

- <https://vite.dev/guide/>
- <https://vite.dev/guide/features.html>
