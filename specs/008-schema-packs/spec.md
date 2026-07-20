# Feature Specification: Composable Schema Packs

**Feature Branch**: `008-schema-packs`

**Created**: 2026-07-20

**Status**: Complete

**Input**: User description: "Pages and conditional edges should be reusable as logical packs; a pack may contain one or several pages and edges for a use case."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Define a logical pack (Priority: P1)

A form author can group one or more pages, their questions, internal conditional edges,
and named entry/outlet ports into a reusable logical unit.

**Why this priority**: Authors need a boundary larger than an individual page but smaller
than a complete form in order to reuse coherent reporting behavior.

**Independent Test**: Define a two-page pack with one entry and two conditional outlets,
validate it independently, and inspect its public ports without referencing another pack.

**Acceptance Scenarios**:

1. **Given** one or more related pages, **When** an author defines a pack, **Then** its
   internal nodes and edges remain private behind named public ports.
2. **Given** a pack with an invalid entry, outlet source, internal reference, or duplicate
   public port, **When** it is validated, **Then** actionable structured problems are returned.
3. **Given** a one-page concern, **When** it is defined as a pack, **Then** it follows the
   same contract as a larger multi-page pack.

---

### User Story 2 - Compose packs into one form (Priority: P1)

A form author can instantiate packs, connect an outlet of one instance to an entry of
another, choose the composition entry, and compile the result into one ordinary form.

**Why this priority**: Composition only creates product value if the existing engine can
execute the result without acquiring a second runtime model.

**Independent Test**: Connect three packs with conditional outlets, compile them, run
the existing schema checker and golden runner, and complete every resulting route.

**Acceptance Scenarios**:

1. **Given** valid pack instances and connections, **When** they are compiled, **Then**
   one self-contained form is produced with no pack-only runtime constructs.
2. **Given** two packs with identical internal ids, **When** both are instantiated,
   **Then** all node, question, option, and outcome identities are collision-free.
3. **Given** an outlet with an existing ordered edge list, **When** it is connected,
   **Then** the connection preserves deterministic edge ordering.
4. **Given** a compiled form, **When** it is serialized and loaded normally, **Then**
   the existing engine executes it without pack-specific configuration.

---

### User Story 3 - Reuse and parameterize pack factories (Priority: P2)

A library author can expose a typed factory that accepts case-specific parameters and
returns a concrete pack, allowing the same logical behavior to be configured and
instantiated more than once.

**Why this priority**: Reuse requires both collision-free repetition and a clear place
for configuration without adding parameter interpretation to the runtime engine.

**Independent Test**: Create two concrete packs from the same factory with different
labels or validation limits, instantiate both in one composition, and verify each
compiled instance retains its supplied configuration.

**Acceptance Scenarios**:

1. **Given** a pack factory and two parameter sets, **When** it creates two concrete
   packs, **Then** compilation preserves each concrete configuration.
2. **Given** the same concrete pack instantiated twice, **When** the form is compiled,
   **Then** the two instances have independent namespaced answers and routes.
3. **Given** a concrete pack represented as data, **When** it is transported as JSON,
   **Then** no executable factory or unresolved parameter is required to run it.

---

### User Story 4 - Diagnose invalid compositions (Priority: P2)

A form author receives complete, stable diagnostics when packs cannot be composed.

**Why this priority**: Packs will commonly be generated or rearranged automatically;
fail-closed diagnostics are essential to a safe authoring loop.

**Independent Test**: Exercise every invalid connection, identity, port, and final-schema
condition and verify deterministic problems without partial output.

**Acceptance Scenarios**:

1. **Given** a missing instance, entry, outlet, target, or duplicate connection,
   **When** compilation is requested, **Then** it fails with a location-specific problem.
2. **Given** unconnected required outlets or unreachable compiled nodes, **When**
   compilation is requested, **Then** no partial form is returned.
3. **Given** multiple independent composition mistakes, **When** compilation is
   requested, **Then** all safely discoverable problems are returned together.

### Edge Cases

- A pack may contain one page, many pages, or a terminal outcome.
- The same pack may be instantiated multiple times under distinct instance ids.
- Internal ids may contain characters that would be ambiguous under naive concatenation;
  namespace encoding must remain injective.
- A source page may expose multiple ordered outlets with mutually exclusive guards.
- An outlet may be optional and remain unconnected only when the pack explicitly declares it.
- A connection may target a named entry other than a pack's default entry.
- Cycles, recursive pack invocation, repeatable instances, and runtime pack loading are
  outside this feature and remain governed by the current form-schema constraints.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST define a concrete pack containing stable pack identity,
  version, a default entry, optional named entries, nodes, and named outlet ports.
- **FR-002**: Each outlet MUST identify a source page, an ordered conditional guard, and
  whether an external connection is required.
- **FR-003**: Pack validation MUST detect invalid entries, invalid outlet sources,
  duplicate or empty ports, invalid internal references, and identity conflicts.
- **FR-004**: The system MUST define a composition containing stable form identity and
  version, a composition entry, uniquely identified pack instances, and connections.
- **FR-005**: Each connection MUST link one named outlet to one named target entry.
- **FR-006**: Compilation MUST namespace every node, question, option, and outcome id
  using an injective, deterministic mapping derived from the instance and local id.
- **FR-007**: Compilation MUST rewrite all internal edges, guards, numeric expressions,
  visibility conditions, entries, outlets, and terminal outcomes consistently.
- **FR-008**: Composition connections MUST be appended after a source page's internal
  ordered edges in the declared connection order.
- **FR-009**: Compilation MUST reject duplicate instance ids, duplicate outlet bindings,
  unknown instances or ports, unconnected required outlets, and invalid final forms.
- **FR-010**: Compilation MUST return all safely discoverable structured problems and
  MUST NOT return a partial form when any error exists.
- **FR-011**: Successful compilation MUST return an ordinary self-contained form that
  contains no pack, instance, port, connection, factory, or unresolved parameter data.
- **FR-012**: The compiled form MUST pass the existing checker and be executable by the
  existing session, replay, probe, and golden-test surfaces without modification.
- **FR-013**: The public authoring surface MUST support typed factories from arbitrary
  author-owned parameters to concrete packs without executing factories at runtime.
- **FR-014**: Pack definitions and compilation MUST remain pure and independent of DOM,
  clock, randomness, storage, network access, and mutable global registries.
- **FR-015**: Pack validation and compilation MUST be deterministic and MUST preserve
  exact 100% governed statement, branch, function, and line coverage.

### Key Entities

- **Concrete Pack**: A reusable, fully resolved set of private nodes and public ports.
- **Pack Entry**: A named public target resolving to one private node.
- **Pack Outlet**: A named conditional edge source awaiting an optional external binding.
- **Pack Instance**: One use of a concrete pack under a composition-local identity.
- **Pack Connection**: An ordered binding from an instance outlet to an instance entry.
- **Schema Composition**: The complete authoring declaration compiled into one form.
- **Composition Problem**: A stable structured explanation of an invalid pack or composition.
- **Pack Factory**: Author-owned pure function from typed parameters to a concrete pack.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A valid composition of at least 20 packs and 500 total nodes compiles
  deterministically in under one second on the project test environment.
- **SC-002**: Instantiating the same pack 100 times produces zero identity collisions
  across nodes, questions, options, and outcomes.
- **SC-003**: 100% of pack-only constructs disappear from successful compiled output.
- **SC-004**: Every defined invalid pack and connection class produces a deterministic,
  location-specific problem and never a partial form.
- **SC-005**: Compiled fixtures achieve 100% engine-measured edge coverage through
  ordinary golden tests without pack-aware execution code.
- **SC-006**: Governed statement, branch, function, and line coverage remain exactly 100%.

## Assumptions

- Packs are authoring-time boundaries; the engine continues to receive one complete form.
- Factories are ordinary pure library functions and are not serialized. Their resolved
  concrete pack output may be serialized or distributed.
- Cross-pack behavior is expressed by composition connections, not by allowing one pack
  to reference another pack's private ids.
- Namespace values are opaque implementation details after compilation; authors use
  ports rather than constructing compiled ids manually.
- A pack registry, package distribution format, visual editor, cycles, recursion, and
  repeatable runtime instances are future features.
