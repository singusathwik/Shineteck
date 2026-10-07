# Project review — 7 October 2026

Baseline: `e07878e`. This review covers source inspection, isolated API tests, dependency scans, a production build, and browser checks. It is not a guarantee that every possible defect has been eliminated.

## Fixes

- MongoDB account state now controls login and authenticated requests in cloud deployments. Stale SQLite passwords, roles and suspensions cannot override it. Sessions use the stable employee ID when local caches are rebuilt. Cloud outages fail closed.
- Cloud startup no longer repopulates a second set of sample local accounts. Repeat local seeding cannot move the employee ID counter backward.
- Registration uploads require a valid employee invitation. Signed document receipts bind the invitation and all file metadata. MIME types and extensions must agree; active HTML/SVG uploads are rejected; rejected document uploads are cleaned up. Upload limits return useful client errors.
- Profile photos are durably stored in a separate public-avatar namespace, with restoration after local file loss. Private documents cannot be retrieved through the avatar route. Replacing a broken avatar clears the old display error.
- Profile document lists include cloud records and company ownership. Invalid employment dates and malformed profile fields are rejected before account suspension. Employment/account updates share a MongoDB transaction and errors cannot be reported as successful saves.
- Timesheet exports no longer classify all period hours above 40 as overtime. CSV exports contain exact daily dates and month allocations, neutralize formulas, and distinguish legacy period totals without daily records. Malformed daily data no longer crashes lists.
- Company changes preserve the employee's current menu. Expired sessions return to sign-in. Request ordering guards stop older filter responses from replacing newer ones. Photo cropping refreshes from the current image and transform.
- API requests default to the same-origin proxy. Pages and document converters load on demand. PDF conversion uses a bundled matching worker instead of an external CDN URL.
- Removed unused vulnerable spreadsheet parsing dependency; updated vulnerable transitive dependencies and Multer, and moved test/development tools out of runtime dependencies.

- Live verification also found administrator profiles included in the employee directory but excluded from dashboard totals. Both now consistently exclude administrator profiles.

## Verification

- `npm run test:portal`: **50 passed, 0 failed**. Includes company isolation/revocation, invitations, invoice arithmetic/rounding, payroll history, daily month allocation, upload receipt tampering, rejected-file cleanup, avatar storage restoration, invalid employment updates, cloud account cache restoration and failed cloud employment writes.
- `npm --prefix client run build`: passed without oversized-chunk warnings. Main entry about **229 KB** uncompressed / **72 KB** gzip, versus about 1.39 MB before on-demand loading.
- `npm audit` and `npm --prefix client audit`: **0 known vulnerabilities** at review time.
- Client lint: no errors. **123 nonblocking warnings remain**: 121 unused declarations/imports in existing code and two context-module Fast Refresh warnings. Runtime Hook dependency warnings were resolved; warnings have not been hidden by changing lint configuration.
- Browser verification used a disposable SQLite database and synthetic data, not production employee edits. All admin navigation sections opened with no console errors. All employee menus opened; switching companies retained Timesheets and correctly filtered the list. An October/November period displayed four daily inputs and exact 12.50 + 7.25 = 19.75 hour totals.
- Browser PDF download succeeded. The saved 80-hour period report contains its full total and no fabricated overtime line.
- Vercel and Render should deploy the same Git revision; check hosting status and a signed-in session after release. Git push alone is not evidence that both hosts have updated.

## External prerequisites and limits

- Real invitation delivery still needs an approved verified sender and hosting email credentials. Tests use a simulated sender; no real invitation emails were sent in this review.
- Employer-specific HR templates must be supplied by HR. Existing missing historical files require re-upload; durable storage protects newly uploaded files and cannot recreate lost originals.
- Production company assignments and credentials were not changed. An employee with no assigned company is deliberately denied workspace access.
- Cloud outage/transaction failure scenarios were tested with controlled model substitutes. This is not a penetration test, multi-replica load test, or exhaustive audit of every production record.
