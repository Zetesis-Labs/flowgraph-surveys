# Accessibility Contract

**Feature**: `004-react-adapter`
**Baseline**: WCAG 2.2 Level AA for default renderer behavior

## Automated acceptance

The real-browser harness MUST report no axe violations tagged for WCAG 2 A/AA,
WCAG 2.1 A/AA, or WCAG 2.2 A/AA in these states:

1. Empty active page with required questions.
2. Completed text and number controls.
3. Single-choice and multiple-choice groups.
4. Multiple simultaneous question problems.
5. Page-level routing problem.
6. Disabled/sealed presentation.

Automated success is necessary but not sufficient.

## Keyboard acceptance

The manual and Playwright journeys verify:

- Tab order follows visible question order and then navigation controls.
- Radio groups use native arrow-key behavior.
- Checkboxes toggle with Space.
- Text and number drafts can be entered, corrected, and confirmed without a pointer.
- Enter or activation of Continue flushes dirty drafts before navigation.
- Back is operable without browser-history dependence.
- Rejected navigation moves focus to the first actionable problem.
- Hidden questions and disabled controls are not unexpected focus stops.
- A focus indicator remains visible at 360 px and 1280 px viewport widths.

## Name, role, value, and relationships

- Every text and number control has one programmatic label.
- Every choice group has a legend; every option has its own label.
- Required state is programmatic and also explained in visible copy.
- Problem containers have stable ids referenced by affected controls.
- Invalid controls expose invalid state after rejection.
- Page-level problems use an appropriate live region without stealing focus
  repeatedly.
- Progress has a programmatic name and current value; conditional remaining length is
  not announced as a false fixed question count.

## Focus policy

After rejected navigation:

1. Map problems carrying `where.q` to visible question order.
2. Focus the first matching registered control.
3. If no question maps, focus the page-level problem summary.
4. Do not refocus on unrelated rerenders.
5. Clear the pending focus request after one successful focus attempt.

## Manual screen-reader checklist

At minimum, validate one complete route with VoiceOver on macOS:

- page title and progress are understandable;
- every question and option is announced with correct role and state;
- required and invalid states are announced;
- moving to the next graph page yields a clear context change;
- going back preserves and announces confirmed answers;
- a rejected action identifies the first problem and allows correction;
- completion is announced neutrally with no remaining mutation controls.

Any blocking failure prevents feature acceptance even when axe is green.
