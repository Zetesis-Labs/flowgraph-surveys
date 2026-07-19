# Feature Specification: Core Survey Demo

**Feature Branch**: `006-core-survey-demo`

**Created**: 2026-07-19

**Status**: Complete

**Input**: User description: "Demo local y navegable del núcleo de FlowGraph mediante
una encuesta ficticia para pacientes de psicólogos. El caso psicológico es solo un
fixture para ejercer el core. El alcance termina al enviar: no incluye evaluación,
revisión, reporting posterior ni producto vertical."

## Context

The product under demonstration is the horizontal survey core, not a psychology
application. The fictional patient journey is an executable reference scenario chosen
because branching, conditional visibility, validation, backtracking, reconvergence,
restoration, and immutable completion are easy to understand in that context.

No psychology-specific rule may become a reusable engine behavior. Replacing this
fixture with another valid survey definition must preserve the same navigation and
session guarantees. The web experience exists only to make the core behavior tangible
and testable end to end.

## Clarifications

### Session 2026-07-19

- Q: Which kernel scope must the demo cover? → A: Complete core v1; subflows and repeatables remain deferred to v1.1.
- Q: How must delivery be decomposed across the existing feature specifications? → A: Implement the core v1 feature first; React and the demo follow as dependent features.
- Q: How many survey sessions must the local demo retain? → A: Exactly one; starting a new session replaces the previously retained session.
- Q: How must the fictional demo handle consent? → A: Use an informational introduction only; no consent behavior is required.

### Session 2026-07-20

- Q: Must the executable fixture itself demonstrate every governed v1 guard and numeric
  expression, rather than relying only on the repository conformance suite? → A: Yes.
  Expand the same respondent journey with neutral logistical adaptation that exercises
  every remaining primitive without exposing a score or psychological interpretation.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete and submit an adaptive survey (Priority: P1)

A patient opens a local demonstration survey, reads a short informational introduction,
answers the questions shown, and advances through a route adapted to those answers.
The survey asks only the relevant follow-up questions, reconnects shared sections
without duplication, and ends with an unambiguous submission confirmation.

The demonstration content is a fictional psychology intake questionnaire. It gathers
context and preferences but does not calculate a clinical score or present an
interpretation, diagnosis, recommendation, or treatment guidance.

**Why this priority**: completing and submitting the respondent journey is the entire
user-facing value of this feature.

**Independent Test**: start with no saved progress, begin from the informational
introduction, choose each supported consultation reason in turn, complete the resulting
route, and verify that every route reaches the same neutral submission confirmation
with only its relevant questions included.

**Acceptance Scenarios**:

1. **Given** a patient at the informational introduction, **When** they start the
   demonstration, **Then** the first survey section is shown and progress begins.
2. **Given** a patient who selects a consultation reason, **When** they continue,
   **Then** they see the follow-up section for that answer and later rejoin the shared
   contact-preferences section.
3. **Given** a patient who has completed every required question on their active
   route, **When** they submit, **Then** the survey is sealed and a neutral confirmation
   states that the demonstration response was submitted.
4. **Given** a completed submission, **When** its final screen is shown, **Then** no
   score, assessment, recommendation, diagnosis, or professional review action appears.
5. **Given** a patient who supplies scheduling capacity, interaction preferences, and
   an optional specific request, **When** they continue, **Then** the journey selects
   the applicable logistical follow-up using the complete governed v1 condition set
   and later rejoins the common final section.

---

### User Story 2 - Correct answers without retaining an abandoned route (Priority: P2)

A patient can move back to earlier sections, change an answer, and continue through
the newly applicable route. Answers from a route that is no longer applicable are not
included in the submitted response, while answers that remain applicable are preserved.

**Why this priority**: an adaptive survey must remain trustworthy when a respondent
corrects an earlier decision; otherwise irrelevant or contradictory answers could be
submitted.

**Independent Test**: enter one conditional route, answer its follow-up questions,
go back and choose another route, complete the survey, and verify that the submitted
response contains the new active route but not the abandoned one.

**Acceptance Scenarios**:

1. **Given** a patient on a follow-up section, **When** they go back, **Then** their
   earlier active answers are shown and can be changed.
2. **Given** a patient who changes an answer that controls routing, **When** they
   advance again, **Then** the survey follows the newly applicable route.
3. **Given** a patient who answered questions on an abandoned route, **When** they
   submit through another route, **Then** the abandoned answers are excluded from the
   active submitted response.
4. **Given** a patient who returns to the original route before submitting, **When**
   its section becomes applicable again, **Then** the previously entered answers are
   restored for correction.

---

### User Story 3 - Resume an interrupted survey safely (Priority: P3)

A patient who refreshes or closes the local demonstration before submission can resume
the same in-progress survey on that device. The restored page, answers, route, and
progress are identical to the state before interruption.

**Why this priority**: reliable resumption demonstrates that the survey does not lose
work and that its visible state can be reconstructed consistently.

**Independent Test**: interrupt the survey at every section, reopen it, and compare the
restored route, current section, active answers, and progress with the pre-interruption
state.

**Acceptance Scenarios**:

1. **Given** an unfinished locally saved survey, **When** the patient reopens the
   demonstration, **Then** they can continue from the same section with the same
   active answers and route.
2. **Given** no unfinished survey, **When** the demonstration opens, **Then** a new
   survey starts at the introduction.
3. **Given** a submitted survey, **When** the patient reopens the demonstration,
   **Then** the completed response cannot be edited or submitted again.
4. **Given** a patient on the confirmation screen, **When** they explicitly start a
   new demonstration and confirm replacement, **Then** a separate empty survey replaces
   the previously retained completed session.

---

### User Story 4 - Understand and resolve input problems (Priority: P3)

A patient receives clear, question-specific feedback when an answer is missing or
invalid. The survey preserves what they entered, focuses attention on the relevant
question, and allows progress immediately after correction.

**Why this priority**: validation must prevent incomplete submissions without making
the patient lose answers or guess what needs correction.

**Independent Test**: attempt to advance and submit with every supported invalid or
missing input, correct each highlighted answer, and verify that no rejected action
changes the route or discards data.

**Acceptance Scenarios**:

1. **Given** an unanswered required question, **When** the patient tries to continue,
   **Then** they remain on the section and see a clear message associated with that
   question.
2. **Given** a value outside its stated range or text beyond its stated limit, **When**
   the patient tries to continue, **Then** the entered value remains visible and the
   constraint is explained.
3. **Given** all visible required answers are valid, **When** the patient continues,
   **Then** prior validation messages no longer block progress.
4. **Given** several invalid answers, **When** validation occurs, **Then** a keyboard
   user is directed to the first problem and can identify every affected question.

### Edge Cases

- A section with no applicable questions remains understandable and can advance
  without fabricating answers.
- When no conditional route is definitively applicable, the patient remains on the
  current section and receives a recoverable message rather than being sent to an
  arbitrary route.
- Changing an early answer multiple times never mixes answers from mutually exclusive
  routes in the active submission.
- Repeated activation of Continue or Submit produces only one transition or completed
  submission.
- While required logistical inputs are unanswered, compound numeric guards remain
  unknown; validation keeps the patient on the page until those inputs can be evaluated.
- Every combination of the bounded scheduling values and weighted interaction
  preferences reaches exactly one applicable logistical follow-up.
- Going back from the first survey section never leaves the defined journey.
- Refreshing during an answer edit restores the latest committed answer and never
  invents a partially entered value.
- If saved local progress cannot be read, the demonstration explains that it cannot
  resume and offers a safe new start without displaying corrupted content.
- If local saving is unavailable, the current survey remains usable and clearly warns
  that refreshing or closing will lose progress.
- Once submitted, answer-changing and navigation actions cannot alter the completed
  response.
- Starting a new demonstration requires explicit confirmation when a retained session
  exists; after confirmation, the previous session is no longer locally recoverable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-000**: The psychology scenario MUST remain a replaceable survey fixture; it
  MUST NOT introduce psychology-specific behavior into the horizontal survey
  capabilities.
- **FR-001**: The demonstration MUST present a fictional, non-diagnostic psychology
  intake survey intended to demonstrate response collection, not clinical care.
- **FR-002**: The introduction MUST state that the survey is a local demonstration and
  explain that responses remain on the device; it MUST NOT implement a consent gate.
- **FR-003**: The survey MUST support a shared introduction, at least three mutually
  distinguishable conditional routes, and at least one shared section reached again
  after those routes.
- **FR-004**: The survey MUST include representative single-choice, multiple-choice,
  short text, long text, and bounded numeric questions where supported by the existing
  survey capabilities.
- **FR-005**: The questions shown and the next section MUST be determined solely by
  the current active answers and the predefined survey definition.
- **FR-006**: The survey MUST show only questions applicable to the patient's current
  route.
- **FR-007**: The patient MUST be able to move backward before submission and revise
  any earlier active answer.
- **FR-008**: When a revised answer changes the route, answers from abandoned sections
  MUST remain recoverable if that route is re-entered but MUST NOT count as active or
  be included in the submitted response while the route is abandoned.
- **FR-009**: The survey MUST preserve still-applicable answers when routes reconnect
  to a shared section.
- **FR-010**: Every required, range, choice, and text-length constraint MUST be enforced
  before leaving its section and before final submission.
- **FR-011**: Rejected navigation and submission attempts MUST leave answers, route,
  and progress unchanged and MUST identify actionable problems next to their questions.
- **FR-012**: The survey MUST display the current section and meaningful overall
  progress without promising a misleading fixed question count when the remaining
  route is conditional.
- **FR-013**: An unfinished survey MUST be restorable on the same local device with
  the same active answers, current section, route, and progress.
- **FR-014**: Restoring MUST reconstruct the patient-visible state from the recorded
  survey interactions so that there is only one authoritative history of the session.
- **FR-015**: Final submission MUST be available only when every required question on
  the active route is valid.
- **FR-016**: A successful submission MUST create exactly one immutable completed
  response containing active answers, the traversed route, and interaction
  provenance needed to reproduce the journey.
- **FR-017**: The completed response MUST exclude inactive answers from abandoned
  routes while retaining the immutable interaction history needed to explain how the
  active response was reached.
- **FR-018**: After submission, the session MUST be sealed against further answering,
  backward navigation, or duplicate submission.
- **FR-019**: The final screen MUST provide only a neutral submission confirmation and
  an explicit action to start a separate new demonstration.
- **FR-020**: The patient-facing experience MUST NOT calculate or display a clinical
  score, severity, assessment, diagnosis, recommendation, treatment guidance, or
  professional review workflow.
- **FR-021**: The complete experience MUST run locally without accounts, remote
  services, network access, or real patient data.
- **FR-022**: All controls, questions, validation messages, progress information, and
  confirmation content MUST be usable with keyboard navigation and understandable by
  assistive technology.
- **FR-023**: The layout MUST remain usable on common phone and desktop viewport sizes
  without hiding required controls or question content.
- **FR-024**: The fixture MUST exercise conditional routing, conditional question
  visibility, required and bounded input validation, mutually exclusive routes,
  reconvergence, backward navigation, route correction, inactive abandoned answers,
  interruption restoration, and immutable completion.
- **FR-025**: The fixture definition MUST be rejected before use if its structure
  contains unreachable sections, invalid references, routes without a completion,
  or a supported answer combination that cannot advance.
- **FR-026**: Executable reference journeys MUST cover every defined route and
  transition, including at least one journey that abandons a route and another that
  restores an interrupted session.
- **FR-027**: Patient-facing screens MUST render the current core-derived state and
  report rejected actions; they MUST NOT independently decide question applicability,
  routing, validation, progress, or completion.
- **FR-028**: Acceptance MUST cover the complete governed v1 core: graph traversal,
  three-valued guards and expressions, validation, active truth, event decisions and
  application, replay, structural checking, bounded probing, executable reference
  journeys, and measured transition coverage.
- **FR-029**: Weighted scoring MUST be exercised only as an undisclosed, non-clinical
  logistical routing input and in core conformance tests; the patient-facing experience
  MUST NOT display the score, name it as an assessment, or derive psychological meaning
  from it.
- **FR-030**: This demo MUST consume the behavior governed by the core v1 feature and
  MUST NOT redefine, duplicate, or weaken its navigation, validation, event, replay,
  or schema-verification contracts.
- **FR-031**: The local demonstration MUST retain exactly one survey session, whether
  in progress or completed; starting a new session MUST explicitly replace the retained
  session rather than create a browsable history.
- **FR-032**: The executable fixture MUST directly exercise every governed v1 guard:
  always, answered, selected, not, all, any, and numeric comparison.
- **FR-033**: The executable fixture MUST directly exercise every governed v1 numeric
  expression: literal number, numeric answer, weighted option score, and sum.
- **FR-034**: The additional conditions MUST determine only neutral logistical
  follow-ups such as scheduling or interaction preferences; they MUST NOT influence or
  imply clinical assessment.
- **FR-035**: Executable reference journeys MUST cover the true, false, and unknown
  behavior relevant to the added conditions, every new route, every new reconvergence,
  and every new transition.
- **FR-036**: For every supported combination of the new bounded and finite answers,
  exactly one ordered route MUST advance toward the shared completion, with no semantic
  dead end or ambiguous destination.

### Key Entities

- **Survey Definition**: the immutable versioned description of sections, questions,
  constraints, conditional routes, shared reconvergence points, and neutral completion.
- **Survey Session**: one patient's in-progress or completed journey, pinned to one
  survey-definition version.
- **Interaction Record**: an immutable fact about starting, answering, advancing,
  going back, or submitting, including its ordering and provenance.
- **Active Response**: the applicable answers and traversed route reconstructed from
  the interaction history at a particular point.
- **Completed Response**: the sealed active response produced by a single successful
  submission; it contains no clinical evaluation.
- **Input Problem**: a question-specific, actionable explanation that blocks progress
  without becoming part of the immutable interaction history.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Test patients can complete 100% of the defined conditional routes from
  the informational introduction through neutral submission, including every
  reconvergence point.
- **SC-002**: At least 90% of first-time test participants complete one route without
  assistance in under 8 minutes.
- **SC-003**: In the acceptance suite, 100% of attempts with a missing or invalid
  required active answer are blocked with a question-specific corrective message.
- **SC-004**: In 100% of route-change tests, the completed active response contains no
  answers from abandoned routes and retains all still-applicable answers.
- **SC-005**: In 100% of interruption tests, reopening an unfinished survey restores
  the same committed answers, route, current section, and progress.
- **SC-006**: In 100% of repeated-submit tests, exactly one completed response exists
  and later answer or navigation attempts leave it unchanged.
- **SC-007**: Every defined route presents a confirmation within one second of a valid
  local submission on a typical development machine.
- **SC-008**: Automated and manual accessibility checks find no critical keyboard,
  labeling, focus-order, or error-identification blockers in the primary journey.
- **SC-009**: Review of every patient-visible screen finds zero clinical scores,
  interpretations, diagnoses, recommendations, or professional review actions.
- **SC-010**: The full journey remains usable at representative 360-pixel-wide phone
  and 1280-pixel-wide desktop viewports.
- **SC-011**: Pre-use validation detects 100% of deliberately introduced unreachable,
  dangling, non-completable, and uncovered-routing defects in the fixture corpus.
- **SC-012**: Executable reference journeys traverse 100% of the fixture's defined
  transitions, with coverage measured from the actual journeys.
- **SC-013**: Replacing the psychology fixture with a second valid non-psychology
  fixture requires no change to navigation, validation, restoration, or completion
  behavior.
- **SC-014**: In 100% of replacement tests, the new survey starts empty, the former
  session is no longer locally recoverable, and no session-history interface exists.
- **SC-015**: Automated evidence confirms that 100% of the governed v1 guards and
  numeric expressions are executed by the expanded fixture's reference journeys.
- **SC-016**: The expanded fixture retains 100% transition coverage and bounded probing
  finds zero semantic dead ends across its logistical answer space.
- **SC-017**: Review of every patient-visible screen finds zero displayed scores,
  scoring terminology, or psychological conclusions derived from logistical routing.

## Assumptions

- The feature is a demonstrator using invented content and synthetic responses; no
  real patient or personally identifying information is required.
- “Submission” means recording a completed response locally and showing confirmation;
  nothing is transmitted to a psychologist or external service.
- The survey content gathers consultation context and communication preferences but
  is not a validated psychometric instrument.
- The introduction is informational only; legal consent collection is unnecessary for
  synthetic local demonstration data and remains outside the feature.
- Spanish is the initial demonstration language.
- One person uses one local device and browser at a time; accounts, cross-device
  synchronization, concurrent writers, and shared sessions are outside this feature.
- Local persistence retains one session only; archival retention and recovery after
  explicit replacement are outside this feature.
- Reporting, dashboards, exports, analytics, clinician access, respondent identity,
  notifications, and all post-submission processing are outside this feature.
- The horizontal survey core and its governed session behavior are the product under
  acceptance; this feature supplies only the end-to-end respondent demonstration.
- Delivery is sequenced by feature dependency: the core v1 feature is planned and
  implemented first, followed by its web binding and finally this executable demo.
- Subflows, repeatable collections, and their additional event kinds remain deferred
  to the governed v1.1 scope.
- Production hosting and domain-specific psychology workflows remain outside this
  feature; the local respondent demonstration includes the visual design needed to make
  every governed behavior understandable.
