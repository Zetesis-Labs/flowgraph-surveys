# Accessibility Contract

- Every question has a programmatic legend/label and associated problem text.
- The page title is the primary heading for the active survey section.
- Progress has an accessible name and numeric value.
- Rejected Continue/Submit focuses the first invalid field, or a page-level live
  summary when no field owns the problem.
- Choice cards retain native radio/checkbox semantics and visible focus.
- Modal replacement confirmation traps practical interaction through native dialog
  semantics and returns focus when cancelled.
- Status and persistence messages use appropriate live regions without repeated
  announcements.
- Reading and tab order match visual order at 360 px and desktop widths.
- Color contrast, reduced motion, zoom, and touch target size are verified in browser
  acceptance tests.
