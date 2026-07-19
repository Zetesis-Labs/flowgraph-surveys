# Quickstart Validation: React Survey Adapter

This guide validates feature 004 after implementation. It uses the existing core
fixtures and a minimal package test harness; the styled psychology demo belongs to
feature 006.

## Prerequisites

- Node.js 22 or newer
- pnpm 10.14.0
- Playwright Chromium installed for browser checks

## Install and build

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
```

Expected: core, session, and React adapter project references build with no deep-import
or DOM-boundary errors.

## Static gates

```bash
pnpm lint
pnpm boundaries
pnpm format:check
```

Expected:

- `flow-core` remains platform-free;
- `flow-session` and `flow-react` use only public package roots;
- the browser harness imports the React adapter rather than core semantic modules;
- no dependency cycle is reported.

## Package behavior and coverage

```bash
pnpm test:coverage
```

Expected:

- all existing core and session suites remain green;
- subscription and unsubscription follow the external-store contract;
- rejected/no-op actions do not render fabricated snapshots;
- all supported default renderers pass;
- draft blur and navigation flushing never duplicate an answer;
- renderer precedence is id, kind, default;
- storage success, corruption, quota, and unavailable cases pass;
- every `packages/flow-react/src` file reports 100% statements, branches, functions,
  and lines.

## Browser accessibility

```bash
pnpm test:browser
```

Expected:

- Chromium completes the keyboard journey;
- focus moves to the first problem after rejected navigation;
- a warmed valid action updates the rendered UI in under 100 milliseconds;
- axe reports no targeted WCAG A/AA violation in the states listed in
  [contracts/accessibility.md](./contracts/accessibility.md);
- 360 px and 1280 px harness viewports keep controls and focus visible.

Automated checks do not replace the manual VoiceOver checklist in the accessibility
contract.

## Contract journey

Run the adapter harness and validate this sequence:

1. Create a fresh session from a valid existing fixture.
2. Start it and observe the first page through `useFlowState`.
3. Type into a text field; confirm that no answer is logged per keystroke.
4. Activate Continue; confirm one answer precedes the navigation event.
5. Trigger required, range, and length problems; verify stable messages and focus.
6. Go back, change a routing answer, and confirm the adapter renders only the
   core-derived new route.
7. Register a kind override and an id override; verify id precedence.
8. Persist the complete event log, recreate the session from it, and compare the
   visible view.
9. Simulate a storage write failure; verify the in-memory survey remains usable.
10. Finish the session and verify mutation controls are absent.
11. Repeat a complete journey with a valid non-psychology fixture and verify no adapter
    source change is required.

The public types and error rules for this journey are in
[contracts/public-api.md](./contracts/public-api.md),
[contracts/renderers.md](./contracts/renderers.md), and
[contracts/persistence.md](./contracts/persistence.md).

## Manual accessibility sign-off

Complete the VoiceOver route in [contracts/accessibility.md](./contracts/accessibility.md)
and record pass/fail evidence in the implementation validation results. Any blocking
failure stops acceptance.

## Packaging

```bash
pnpm package:check
```

Expected: `@flowgraph/react` publishes declarations and ESM from its root export,
declares React peers correctly, and exposes no source/deep-import path.
