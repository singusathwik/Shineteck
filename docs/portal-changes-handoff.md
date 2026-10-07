# Employee Portal Changes — current handoff

Updated 7 October 2026. The interrupted document implementation was released in September (`7788e34`, followed by startup fix `e07878e`). The general production URL is https://corporateemployeesignin.vercel.app/.

The latest project-wide review and verification record is [project-review-2026-10-07.md](verification/project-review-2026-10-07.md). It covers account authority, upload validation and persistence, employment updates, timesheet exports, request ordering, navigation, and dependencies. There are 50 passing automated tests, a successful production build, and zero known npm audit vulnerabilities in both packages.

## Remaining operational setup

1. Configure an approved invitation sender and its provider credentials on Render, following `portal.env.example`. Do not put secrets in source or chat. The email adapter has been tested with a simulated provider; real delivery still needs an approved recipient test.
2. Obtain HR-approved employer-specific forms for the remaining download links.
3. Review production company assignments and legacy records using `portal-changes-checklist.md`. Unassigned employee access is intentionally blocked; do not invent assignments.
4. Vercel builds from Git. Render currently requires a manual deployment. Check that both hosts run the intended revision and verify authenticated access after deployment. See the latest release result in the task conversation.

Pre-existing design changes and the source DOCX are outside the review commit. No production employee records, passwords, company grants, or real invitation emails were modified as part of testing.
