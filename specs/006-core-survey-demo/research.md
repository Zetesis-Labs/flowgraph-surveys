# Research: Core Survey Demo

## Tailwind integration

**Decision**: Use Tailwind CSS `4.3.3` through `@tailwindcss/vite` `4.3.3`.

**Rationale**: The Vite plugin is the shortest supported local build path and keeps
the app's visual system in CSS utilities/component layers without a bespoke build
pipeline. Versions are pinned to keep the demo reproducible.

**Alternatives considered**:

- CSS modules: capable, but does not satisfy the requested Tailwind implementation.
- Runtime CDN: rejected because the demo must run without runtime network access.
- Tailwind 3 config: rejected because the current Vite plugin removes unnecessary
  configuration and content scanning boilerplate.

## React integration boundary

**Decision**: Compose `useFlowSurvey` and `FlowPage` from `@flowgraph/react`; do not
reimplement page selection, validation, progress, or navigation in the app.

**Rationale**: The adapter already gives accessible semantic renderers, draft flushing,
friction focus, and an external-store subscription. Styling its semantic output keeps
the demo visually independent while proving the public adapter.

**Alternative considered**: A fully custom survey renderer. Rejected because it would
duplicate adapter responsibilities and weaken the conformance claim.

## Local session persistence

**Decision**: Use `createBrowserEventStore` and `persistSession` with one stable key.
On load, create the session by replaying stored events. Explicit replacement clears
the envelope and creates a fresh session.

**Rationale**: This preserves the log as the only durable truth and already maps
storage/read/upcast failures to typed problems.

**Alternative considered**: Persisting a React snapshot. Rejected because snapshots
can diverge from replay and violate the constitution.

## Fixture verification

**Decision**: Run `check`, `probe`, and `runGoldens` in automated tests and expose a
small fail-fast fixture verifier for development builds.

**Rationale**: The structural checker catches invalid references and reachability,
bounded probing catches semantic dead ends, and goldens produce engine-measured edge
coverage for every route.

## Visual direction

**Decision**: Use a calm editorial visual system: warm off-white canvas, deep ink
surfaces, coral action color, mint status accents, large typography, restrained
geometric motifs, a desktop journey rail, and a compact mobile header.

**Rationale**: It reads as a finished respondent product without pretending to be a
clinical portal. The psychology wording remains neutral and can be replaced with the
fixture.

## Runtime network

**Decision**: Bundle all code, fonts (system stack), and visuals locally. Use CSS/SVG
geometry rather than remote imagery.

**Rationale**: The application remains deterministic and works offline after the local
development server or production bundle is available.

## Complete primitive demonstration

**Decision**: Exercise the remaining guard and numeric-expression vocabulary through
neutral scheduling capacity and interaction-format routing inside the same fixture.

**Rationale**: A single executable fixture can now prove the full v1 vocabulary rather
than asking a viewer to trust unrelated kernel tests. The weighted value is never
rendered, named, persisted as an assessment, or given psychological meaning.

**Alternative considered**: A separate technical “operator lab”. Rejected because it
would stop being a coherent respondent journey and weaken the end-to-end proof.
