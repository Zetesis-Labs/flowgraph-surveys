# Feature Specification: Attachment Inputs

**Feature Branch**: `007-attachment-inputs`

**Created**: 2026-07-20

**Status**: Complete

**Input**: User description: "Consolidate the generic attachment capability independently from any vertical demo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Author an attachment question (Priority: P1)

A form author can add a question that accepts file references and declares whether it
is required, how many files are allowed, which media types are accepted, and the
maximum size of each file.

**Why this priority**: Without a portable attachment definition, reporting forms cannot
request supporting files consistently across different products and user interfaces.

**Independent Test**: Parse a form containing an attachment question, serialize it, and
verify that its constraints survive the round trip without platform-specific data.

**Acceptance Scenarios**:

1. **Given** a valid attachment question, **When** the form is loaded, **Then** every
   declared constraint is available to validation and presentation adapters.
2. **Given** an unknown field or malformed constraint, **When** the form is loaded,
   **Then** it is rejected rather than interpreted approximately.

---

### User Story 2 - Answer with governed file references (Priority: P1)

A respondent can select one or more existing files and the form records stable
references and metadata while the presentation layer retains the file data only for
the lifetime chosen by that adapter.

**Why this priority**: Reports need evidence without introducing binary data,
platform dependencies, randomness, or input/output operations into the governed core.

**Independent Test**: Answer an attachment question with supported references, navigate
forward and backward, replay the event log, and obtain the same active answer.

**Acceptance Scenarios**:

1. **Given** valid file references, **When** the respondent answers, **Then** the
   references participate in validation, replay, active truth, and serialization.
2. **Given** an attachment answer on an inactive page, **When** the active route
   changes, **Then** the historical event remains but the answer no longer affects the
   current form.
3. **Given** a browser renderer, **When** files are selected, **Then** no camera
   capability is requested and no binary content is persisted in the event log.

---

### User Story 3 - Correct invalid selections (Priority: P2)

A respondent receives actionable feedback for invalid counts, types, sizes, or
duplicate references and can remove or replace files before continuing.

**Why this priority**: File constraints are useful only if invalid input is blocked
predictably and remains correctable.

**Independent Test**: Exercise every constraint boundary, remove and replace accepted
files, and verify that navigation is enabled only for a valid current-page answer.

**Acceptance Scenarios**:

1. **Given** too few or too many references, **When** navigation is requested, **Then**
   the current page is retained with a count problem.
2. **Given** an unsupported media type, oversized file, or duplicate reference,
   **When** the answer is proposed, **Then** the invalid proposal is rejected with a
   specific problem.
3. **Given** an accepted file, **When** it is removed or replaced, **Then** both the
   governed reference answer and adapter-owned file store reflect the change.

### Edge Cases

- Zero files are valid only when the question is optional or declares a zero minimum.
- The exact maximum count and exact maximum byte size are accepted.
- Two different files may share a display name; identity is determined by reference id.
- A repeated reference id is invalid even when its other metadata differs.
- Empty media types, negative or unsafe sizes, unknown answer fields, and unsupported
  types fail closed.
- A remounted presentation adapter may retain metadata without retaining binary files;
  the host decides whether to request reselection or abandon that answer.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support an attachment question with stable identity,
  display text, optional visibility, required status, minimum and maximum file counts,
  accepted media types, and maximum size per file.
- **FR-002**: Attachment question definitions MUST use strict parsing and reject
  malformed, unknown, inconsistent, or unsafe constraints.
- **FR-003**: An attachment answer MUST contain only stable reference identity, file
  name, media type, and non-negative safe byte size.
- **FR-004**: Attachment answers MUST participate in the same event sourcing, replay,
  serialization, active-truth, and current-page rules as every other answer kind.
- **FR-005**: Validation MUST report distinct problems for required input, invalid
  count, unsupported media type, excessive size, and duplicate reference identity.
- **FR-006**: Schema checking MUST identify impossible or inconsistent attachment
  constraints before a session starts.
- **FR-007**: Bounded probing MUST generate valid attachment candidates when an
  attachment answer participates in conditional routing.
- **FR-008**: Presentation adapters MUST be able to retain binary files separately
  from governed references and inject that file store into rendering.
- **FR-009**: The default browser renderer MUST allow selection, listing, removal, and
  replacement of existing files without enabling camera capture.
- **FR-010**: Rejected attachment proposals MUST leave the last accepted answer and
  adapter-owned files unchanged.
- **FR-011**: The attachment capability MUST remain independent of any particular
  reporting vertical or demonstration fixture.
- **FR-012**: All governed package behavior added by this feature MUST preserve exact
  100% statement, branch, function, and line coverage.

### Key Entities

- **Attachment Question**: A form question and its declarative count, type, size,
  requirement, and visibility constraints.
- **Attachment Reference**: Stable serializable metadata identifying a selected file
  without containing its binary content.
- **Attachment File Store**: Adapter-owned volatile association between references and
  actual file objects.
- **Attachment Problem**: A structured reason why a definition or answer is invalid.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Authors can round-trip 100% of valid attachment constraints through the
  public form format without data loss.
- **SC-002**: Every defined invalid count, type, size, duplication, and required-input
  boundary produces a deterministic, distinct problem.
- **SC-003**: Replaying the same attachment event log any number of times produces an
  identical state and never requires access to file binaries.
- **SC-004**: Default browser interaction supports selection, removal, replacement,
  disabled state, and validation without exposing a camera affordance.
- **SC-005**: Governed packages retain 100% measured coverage across statements,
  branches, functions, and lines.
- **SC-006**: A repository-wide search finds zero vertical-specific terminology in the
  attachment capability and its tests.

## Assumptions

- File transfer, durable blob storage, virus scanning, previews, and upload progress
  belong to host applications or future adapters, not this feature.
- Reference ids are created by the effectful shell and are opaque to the core.
- Media-type allowlists are exact strings; wildcard and extension matching are outside
  the initial scope.
- A volatile browser store is the default adapter behavior; durable binary persistence
  is not implied.
