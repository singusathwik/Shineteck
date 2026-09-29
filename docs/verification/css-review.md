# CSS and error review — 2026-09-29

Fixed in the current local working tree:

- The narrow mobile header clipped Sign out and created horizontal page overflow. Responsive spacing and brand sizing now keep actions visible, with compact search below desktop width.
- The mobile notifications dropdown extended beyond the left edge. It now stays inside viewport margins and scrolls within the available height.
- Closed mobile navigation remained available to keyboard focus. It is now hidden until opened; navigation also has accessible close and current-page labels.
- Expense amount headings now align right with monetary values. Company forms, table wrappers, payroll summaries, and employee names can shrink or wrap within their columns.
- Employee timesheet date filters now have visible labels and shrink to phone widths.
- Both dashboard timesheet shortcuts targeted the nonexistent employee page `timesheets`, producing a blank content area. They now target `timesheet`.
- Shared focus indicators, reduced-motion handling, and mobile dialog height/scroll containment were added.

Verification:

- Production client build passed; existing large-bundle warning remains.
- Portal automated suite: 38 passed, 0 failed.
- Oxlint: exit 0, no errors; 170 existing warnings remain (including unused declarations and hook dependencies).
- Git whitespace check passed.
- Isolated SQLite preview used synthetic admin/employee accounts; production data was untouched.
- Browser checks at 320, 390, 768, and 1280 pixels. Checked header/menu, notifications, expense dialog, populated demo payroll history, employee timesheets, and document table containment.
- Payroll Year/Currency/Export controls share the same bottom edge and 40px height. Monetary table headings are right aligned.
- Employee dashboard All Timesheets opens Work Timesheet Submissions after the fix.
- No browser console errors or warnings were recorded during the exercised flows.
- Screenshot: `css-mobile-timesheets.png`.

These are local verification results, not proof of a deployed release or an exhaustive audit of every route. Existing pending email/template/deployment items remain documented in `../portal-changes-handoff.md`.
