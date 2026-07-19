# Feature Specification: React Survey Adapter

**Feature Branch**: `004-react-adapter`

**Created**: 2026-07-19

**Status**: Ready for Planning

**Input**: User description: "Build the survey UI in React while keeping routing,
validation, active-answer, progress, replay, and completion logic exclusively in the
existing FlowGraph core."

## Context

React applications need a small, reusable way to observe a FlowGraph survey session,
render its current state, collect respondent input, and report rejected actions. The
adapter exists to connect React to the governed core; it is not another survey engine.

The first consumer is the local respondent demo described by feature 006. Other React
applications must be able to reuse the same binding and renderers with a different
valid survey definition, text resolver, or visual treatment.

## Clarifications

### Session 2026-07-19

- Q: What server-rendering scope must React adapter v1 support? → A: Client-only; SSR is out of scope.
- Q: When must high-frequency text and number inputs dispatch answers? → A: Keep a local draft and commit it on blur or before navigation.
- Q: What accessibility baseline must the default renderers provide? → A: WCAG 2.2 AA, validated with automated and manual checks.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Observe and control a survey session (Priority: P1)

A React application developer connects a single FlowGraph session to the UI. Every
successful session change is reflected in the rendered page, while the application
uses the core-derived current page, visible questions, progress, navigation
availability, and completion state without reimplementing those decisions.

**Why this priority**: a reliable one-way binding between the governed session and the
UI is the minimum useful adapter.

**Independent Test**: connect a session, execute start, answer, next, back, and finish
actions, and verify that the rendered state always matches the session snapshot and
core selectors.

**Acceptance Scenarios**:

1. **Given** a connected session, **When** the session commits a successful action,
   **Then** every subscribed React consumer renders the corresponding immutable
   snapshot.
2. **Given** a connected session, **When** an action is rejected, **Then** the
   committed session state remains unchanged and the caller receives the actionable
   problems for display.
3. **Given** multiple components observing the same session, **When** one component
   triggers a successful action, **Then** all observers converge on the same snapshot.
4. **Given** a component that is removed, **When** the session changes later, **Then**
   the removed component no longer receives updates.

---

### User Story 2 - Render accessible survey questions (Priority: P1)

A React application developer can render the current survey page using default
question controls. A respondent can understand, answer, correct, and navigate those
controls using pointer, keyboard, or assistive technology.

**Why this priority**: the local demo needs a complete respondent UI, not only a state
subscription primitive.

**Independent Test**: render every supported question kind with labels, help text,
values, required state, and problems; operate the complete page by keyboard and verify
its accessible relationships.

**Acceptance Scenarios**:

1. **Given** a visible text, number, single-choice, or multiple-choice question,
   **When** it is rendered, **Then** its label, current value, required state, and any
   problem are conveyed programmatically.
2. **Given** several invalid questions, **When** navigation is rejected, **Then** focus
   moves deterministically to the first problem and every problem remains identifiable.
3. **Given** a hidden or inactive question, **When** the page is rendered, **Then** no
   control for that question is present.
4. **Given** a completed session, **When** the UI renders it, **Then** answer and
   navigation controls capable of mutating the session are absent.

---

### User Story 3 - Customize presentation without changing semantics (Priority: P2)

A React application developer can replace a default question renderer for an entire
question kind or for one question identifier. The custom renderer receives only the
question-facing data and callbacks it needs, so it cannot silently become a second
source of routing or validation truth.

**Why this priority**: different products need different presentation while sharing
the same governed survey behavior.

**Independent Test**: replace one renderer by question kind and another by identifier,
then verify precedence, answer delivery, and unchanged core-derived navigation,
validation, and completion.

**Acceptance Scenarios**:

1. **Given** no custom renderer, **When** a supported question is shown, **Then** its
   default renderer is used.
2. **Given** a renderer registered for a question kind, **When** that kind is shown,
   **Then** the registered renderer replaces the default.
3. **Given** both a kind renderer and an identifier-specific renderer, **When** that
   identified question is shown, **Then** the identifier-specific renderer wins.
4. **Given** a custom renderer, **When** it reports an answer, **Then** the answer is
   sent through the same session contract as a default renderer.

---

### User Story 4 - Preserve deliberate input and report friction (Priority: P2)

A respondent can type naturally without creating a durable interaction for every
keystroke. Text and number drafts are confirmed when the respondent leaves the field
or navigates, and a rejected action preserves both confirmed session data and the
visible correction context.

**Why this priority**: the event history should record deliberate answers while the UI
remains comfortable and recoverable during correction.

**Independent Test**: edit text and number fields, blur them, navigate with a dirty
draft, trigger validation failures, and verify the exact ordering of confirmed answers,
navigation attempts, visible values, and problems.

**Acceptance Scenarios**:

1. **Given** a text or number field with focus, **When** the respondent types,
   **Then** the visible draft updates without recording every keystroke as an answer.
2. **Given** a dirty valid draft, **When** the field loses focus, **Then** exactly one
   confirmed answer is sent to the session.
3. **Given** one or more dirty drafts, **When** the respondent navigates, **Then** all
   drafts are confirmed before the navigation action is attempted.
4. **Given** a rejected answer or navigation action, **When** problems are displayed,
   **Then** the respondent's visible input remains available for correction.

### Edge Cases

- A successful session update occurring during a React render never causes an
  inconsistent or partially updated view.
- Repeated renders without a session change do not fabricate a new survey snapshot.
- A rejected reentrant action is surfaced as friction and does not trigger an update
  loop.
- A custom renderer missing for an unsupported question kind fails visibly for the
  developer rather than silently omitting the question.
- A text resolver missing a requested key uses the definition's fallback text.
- Two dirty fields are confirmed in their stable page order before navigation.
- Leaving a field and immediately activating Continue does not confirm the same draft
  twice.
- Removing and remounting a renderer restores the latest confirmed value; an
  unconfirmed draft is intentionally ephemeral.
- An application storage failure does not make the current in-memory survey unusable.
- Corrupt restored events are rejected by the governed session restoration contract
  and are never rendered as trusted survey state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The adapter MUST connect a React consumer to exactly one existing
  FlowGraph session and expose its current immutable state.
- **FR-002**: A successful session change MUST notify connected consumers; rejected or
  no-op actions MUST NOT fabricate a state change.
- **FR-003**: Disconnecting a consumer MUST stop all later notifications to that
  consumer.
- **FR-004**: The adapter MUST use the core's public selectors as the sole source of
  current page, visible questions, progress, back availability, active answers, and
  completion.
- **FR-005**: The adapter and its renderers MUST NOT independently evaluate guards,
  choose graph edges, decide visibility, validate domain answers, calculate progress,
  reconstruct history, or determine completion.
- **FR-006**: The adapter MUST support the governed text, bounded number,
  single-choice, and multiple-choice question kinds.
- **FR-007**: Default renderers MUST receive and present the question definition,
  resolved text, confirmed value, visible draft where applicable, and associated
  problems.
- **FR-008**: Default and custom renderers MUST report answers through one common
  answer contract without direct access to graph traversal or unrelated questions.
- **FR-009**: Applications MUST be able to register renderers by question kind and by
  stable question identifier; an identifier-specific renderer MUST take precedence.
- **FR-010**: Every displayed text reference MUST be resolved at render time, use its
  fallback when no localized value exists, and MUST NOT be written back into session
  data.
- **FR-011**: Default text and number controls MUST keep unconfirmed edits as ephemeral
  drafts and confirm them once on blur or immediately before navigation.
- **FR-012**: Default choice controls MUST confirm deliberate selection changes
  immediately.
- **FR-013**: A navigation action MUST confirm all dirty drafts in stable page order
  before attempting forward or backward navigation.
- **FR-014**: Rejected answer or navigation actions MUST preserve committed session
  state and expose their problems for question-specific or page-level display.
- **FR-015**: Following a rejected navigation action, focus MUST move to the first
  actionable problem in stable page order.
- **FR-016**: Default renderers MUST meet the WCAG 2.2 AA baseline for labels, keyboard
  operation, focus order, status communication, and error identification.
- **FR-017**: The adapter MUST permit a complete client-side survey journey without
  accounts, remote services, or server rendering.
- **FR-018**: Server rendering and hydration guarantees MUST remain outside adapter v1.
- **FR-019**: The adapter MUST expose newly committed event batches to application
  persistence subscribers without taking ownership of storage.
- **FR-020**: The reference persistence integration MUST restore only through the
  governed session replay path and MUST treat snapshots as disposable caches rather
  than authoritative history.
- **FR-021**: Storage unavailability or write failure MUST be reportable to the
  application while leaving the current in-memory session usable.
- **FR-022**: Invalid restored history MUST be rejected before any state derived from
  it is presented as trusted.
- **FR-023**: Dispatch attempted during a session notification MUST surface the
  governed `reentrant-dispatch` rejection without retrying or queuing it.
- **FR-024**: The adapter MUST remain usable with any valid v1 survey definition and
  MUST contain no psychology-specific behavior.
- **FR-025**: The package MUST expose a documented public contract sufficient for the
  local demo without requiring imports from internal core or session modules.

### Key Entities

- **React Session Binding**: the connection through which a consumer observes one
  immutable survey-session snapshot and dispatches respondent actions.
- **Question View**: the core-derived, presentation-ready description of one visible
  question, its confirmed answer, resolved text, and current problems.
- **Renderer Registry**: the application-supplied mapping from supported question
  kinds or stable question identifiers to presentation components.
- **Input Draft**: an ephemeral text or number edit that is visible in the current
  control but is not part of the authoritative interaction history until confirmed.
- **Friction State**: ephemeral problems returned by rejected actions, associated with
  their questions or current page and cleared by a relevant successful correction.
- **Text Resolver**: the presentation boundary that resolves a text reference while
  preserving its provided fallback.
- **Persistence Subscriber**: an application-owned observer that stores newly
  committed events and can supply a past event log for governed restoration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of adapter conformance cases, every rendered survey state equals
  the state and public-selector results of the connected session.
- **SC-002**: Across start, answer, advance, back, correction, and finish journeys,
  zero routing, visibility, validation, progress, replay, or completion decisions are
  duplicated in the presentation layer.
- **SC-003**: All four supported question presentations can be completed using only a
  keyboard and expose their label, value, required state, and problems to assistive
  technology.
- **SC-004**: Automated accessibility checks report zero critical WCAG 2.2 A or AA
  violations across the default-renderer states, and the manual keyboard and
  screen-reader checklist has no blocking failures.
- **SC-005**: In 100% of dirty-draft navigation tests, each draft produces exactly one
  confirmed answer before navigation and no keystroke-level answer history.
- **SC-006**: In 100% of rejected-action tests, committed session state remains
  unchanged, the visible correction context is preserved, and focus reaches the first
  actionable problem.
- **SC-007**: Renderer selection is deterministic in 100% of registry tests:
  identifier override, then kind override, then default.
- **SC-008**: A second valid non-psychology fixture is rendered and completed without
  modifying adapter behavior.
- **SC-009**: Restoring every valid reference journey produces the same visible state
  as the uninterrupted journey; every corrupt-history fixture is rejected before
  trusted rendering.
- **SC-010**: Storage failure simulations leave 100% of current in-memory journeys
  usable and provide a visible failure signal to the host application.
- **SC-011**: A valid local respondent action is reflected in the visible UI within
  100 milliseconds on a typical development machine.
- **SC-012**: The automated suite exercises 100% of the adapter's defined public
  behaviors, including success, rejection, unsubscription, draft flushing, renderer
  precedence, restoration, and accessibility states.

## Assumptions

- Feature 001's public core and session contracts are implemented and remain the
  governing source of survey behavior.
- React applications are client-side in v1; server rendering and hydration may be
  specified separately later.
- One graph page maps to one rendered survey screen for the initial demo.
- Applications own visual branding, layout composition, localization dictionaries,
  persistence medium, and user-facing storage warnings.
- The adapter provides accessible unstyled or minimally styled defaults; feature 006
  supplies the cohesive demo presentation.
- Input drafts are intentionally not restorable after refresh; only confirmed answers
  belong to the event history.
- The first demo has one local writer and one retained session; multi-device sync,
  concurrent editing, authentication, analytics, and reporting are outside scope.
- Default renderers cover only the question kinds governed by core v1. Subflows and
  repeatable collections remain deferred to v1.1.
