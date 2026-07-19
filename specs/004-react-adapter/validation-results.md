# Validation Results: React Survey Adapter

**Feature**: `004-react-adapter`  
**Date**: 2026-07-19  
**Environment**: macOS arm64, Node.js 22.22.3, pnpm 10.14.0, TypeScript 5.9.3,
Vitest 4.1.10, Playwright 1.61.1, Chromium

## Automated gates

| Command | Observed duration | Outcome |
|---|---:|---|
| `pnpm format:check` | < 1 s | PASS — all files match Prettier |
| `pnpm lint` | ~1 s | PASS — zero ESLint findings |
| `pnpm typecheck` | ~4 s with the static gate group | PASS — production and test projects |
| `pnpm boundaries` | < 1 s | PASS — 225 modules, 348 dependencies, zero violations |
| `pnpm build` | < 1 s after cached typecheck | PASS — all project references |
| `pnpm test:coverage` | 3.77 s Vitest duration | PASS — 179 tests and 100% statements, branches, functions, and lines |
| `pnpm test:browser` | 2.5 s Playwright duration | PASS — 7 Chromium tests |
| `pnpm package:check` | ~6 s observed wall time | PASS — three tarballs, `publint`, `attw`, and four isolated consumers |

Coverage at acceptance: 1113/1113 statements, 757/757 branches, 285/285
functions, and 957/957 lines.

Browser acceptance includes 360 px and 1280 px journeys, native Space/arrow choice
operation, correction after rejected navigation, first-problem focus, page-level
routing friction, all targeted axe A/AA tags, and a warmed action-to-render assertion
below 100 milliseconds.

## Quickstart contract journey

| Step | Evidence | Outcome |
|---|---|---|
| Fresh valid session and observed start | `use-flow-state.test.tsx`, browser harness | PASS |
| No answer per text keystroke | `draft-event-log.test.tsx` | PASS |
| One draft answer precedes navigation | `navigation-flush.test.tsx`, `draft-event-log.test.tsx` | PASS |
| Required, range, length and focus friction | renderer contracts, `friction-focus.test.tsx`, browser tests | PASS |
| Back, routing-answer change and new core-derived route | `cross-fixture-conformance.test.tsx` | PASS |
| Kind and id renderer override with id precedence | `renderer-registry.test.tsx`, `custom-renderer.test.tsx` | PASS |
| Complete-log persistence and equivalent governed restore | persistence contract/integration tests | PASS |
| Write failure leaves in-memory session usable | `persist-session.test.ts` | PASS |
| Finished session exposes no mutation controls | `flow-page.test.tsx`, browser completion | PASS |
| Non-psychology fixture without adapter changes | library reading fixture conformance | PASS |

No account, network service, remote storage, SSR, or hydration path is used.

## Package evidence

- `@flowgraph/core`, `@flowgraph/session`, and `@flowgraph/react` pass strict
  `publint` and the ESM-only `arethetypeswrong` profile.
- JavaScript ESM and strict TypeScript consumers pass from installed tarballs.
- React ESM and strict TSX consumers pass from installed tarballs with React as a peer.
- Deep `src/` imports fail at compile time as intended.

## Manual VoiceOver checklist

Status: **PENDING USER AUTHORIZATION TO TOGGLE VOICEOVER**.

The automated accessibility and keyboard checks have no blocking failure. Activating
VoiceOver changes a local macOS accessibility setting, so the final manual route must
not be marked complete until that explicit authorization is received and the
announcements are observed.
