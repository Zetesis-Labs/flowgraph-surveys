# UI Contract

## Screens

1. **Introduction**: identifies the experience as a local fictional demo, explains
   on-device storage, and exposes one primary Start action.
2. **Survey**: shows brand/context, current section, route-aware progress, applicable
   questions, inline problems, Back, and Continue/Submit.
3. **Completion**: neutral submitted confirmation only; no answers, score,
   interpretation, advice, review, or clinical language.
4. **Recovery**: explains unreadable saved progress without rendering its contents and
   offers an explicit safe replacement.
5. **Replacement dialog**: names the destructive local replacement and requires
   Cancel or Confirm.

## Core authority

The page title, visible questions, values, progress, backward availability, problems,
and completion status are read from `FlowSurveyController`. UI actions call only
`answer`, `next`, or `back`. The application must not predict the next page.

Weighted logistical values and numeric-expression results are never rendered. The UI
shows only the follow-up page selected by the core.

## Presentation

- Desktop: persistent contextual rail plus focused survey panel.
- Mobile: single-column card with progress and controls remaining in reading order.
- Validation errors stay adjacent to their questions.
- Route labels may summarize completed navigation for orientation but never decide it.
