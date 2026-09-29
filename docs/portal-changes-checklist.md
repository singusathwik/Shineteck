# Employee Portal Changes — requirement check

Reviewed against every section of the root `Employee Portal Changes.docx`, including edits interrupted by connectivity failures. Verified 29 September 2026. Application changes are in the working tree; no commit, push, or application deployment was performed during this continuation.

| Document order | Requirement | Result and evidence |
| --- | --- | --- |
| 1 | Admin navigation: Staff & Placements, Timesheet & Payroll, Finance | Corrected on follow-up to match the requested groups exactly: Staff & Placements has Employee Directory and Vendor Placements; Timesheet & Payroll has only Timesheet Approvals; Finance has US Expenses and India Expenses. Add Employee moved to Operations. Payroll Information/Management removed from sidebar and the obsolete payroll command removed from search; existing payroll code and records are preserved. |
| 2 | Vendor MSA, PO to Upload, PO Start/End Dates and six visa options | Implemented. Private MSA/PO upload/download, validated dates, company ownership. H-1B, OPT, CPT, H-4 EAD, Green Card, US Citizen. Browser field inspection and HTTP upload/download tests pass. |
| 3 | Unified username/password login and employee company restrictions | Implemented. Email or employee ID, no role/demo buttons. Invitations control registration. Employees see only assigned enabled companies; files, timesheets and vendor records enforce company access on the server. Tested super admin, restricted admin and employee sign-in. |
| 4 | Simple Company Management with add and Enable/Disable, retaining data | Implemented. Five defaults retained, Reliability Sciences display name follows document. No company delete endpoint or extra detail tabs. Disable/reenable tests retain employee records and revoke access immediately. |
| 5 | General URL without Shineteck | Connected `https://corporateemployeesignin.vercel.app/` to the existing Vercel project. Vercel reports Valid Configuration, Production. Public login page opens. Existing `shineteck.vercel.app` retained. The alias currently serves the previously deployed release, not these local changes. |
| 6 | Add Domain Admin: first/last/email/company checkboxes/Send Email | Implemented. Email lists companies and contains a one-use, seven-day registration link. Admin acceptance and restricted grants tested. Actual delivery awaits verified sender configuration. |
| 7 | Domain Admin Add Employee with company choices and registration email | Implemented. Scope limits invitation choices and is rechecked at acceptance. Invited identity/company assignments are preserved. Employee registration/login, expiry, replay and sender-failure tests pass. Actual delivery awaits verified sender configuration. |
| 8 | Remove employee Pay Stubs, Payment Statements and Account dashboard grids | Implemented and browser verified. Timesheets and document cards remain. |
| 9 | Remove Working Status; add Work Location Address | Implemented. Profile edit/read and directory use the saved address. HTTP persistence and browser inspection pass. |
| 10 | Dates first, inclusive daily hours, exact month allocation | Implemented. Jan 1–Jan 8 produces eight dates. Server derives hours, validates every day, blocks overlapping active submissions/reapproval of replaced timesheets. Employee history, admin review and approved monthly payroll export display the split. Browser sample: Jan 30–Feb 2, 19.75 total = January 12.50 + February 7.25. |
| 11 | Document Vault six-column list | Implemented: Document Name, Form to Download, Upload, Date Uploaded, Document Type, Expiry Date. Private file persistence, expiry and company checks tested. Official W-4/W-9/I-9 links supplied. Identity records do not need blank forms. Approved employer-specific agreements, ACH and insurance templates were not supplied; these rows identify HR as the source. |
| 12 | Remove employee Paystubs & Statements menu | Implemented in navigation, page routing and command search; browser verified. |
| 13 | Directory: Emp ID, Name, Job Title, Vendor Name, Client Name, Work Location, Start Date, End Date, Project Status | Implemented with search, status filter, CSV and employee detail links. Browser verified. Existing employment Active/Inactive status is used for Project Status. |

## Verification

- `npm run test:portal`: **42 passed, 0 failed**, including login credentials, forged roles/company choices, active-session access revocation, domain-admin email content, and Domain Admin-to-employee multi-company invitation/registration, alongside company, invoice, payroll, cloud-profile and onboarding workflow checks.
- `npm --prefix client run build`: passed. Existing large bundle warning remains.
- Client/server static checks with `client/.oxlintrc.json`: exit 0, no errors. Repository warnings remain (unused symbols and hook/export guidance); this is not a warning-free lint claim.
- `git diff --check`: passed.
- Browser tests used a temporary SQLite database, synthetic accounts and isolated uploads on port 5174. No live employees, payroll, passwords or real invitations were changed by these tests.
- Browser verified login, super-admin menu, simple company list, invitation fields, directory, vendor/visa form, regional expenses, restricted company options, employee dashboard, profile, document vault, daily entry, saved timesheet, admin review and monthly approved hours.
- Fixed issues discovered during checks: obsolete login role variable causing a blank page, undefined old payroll loading setter, daily date-input updates, missing payroll company selection, cross-company legacy compensation exposure, and corrected-timesheet double counting. Added `no-undef` as an error in lint configuration.
- Evidence: `verification/daily-hours-review.png`, `verification/general-url.png`.

## Deployment and data dependencies

1. Configure the Render backend with `APP_PUBLIC_URL=https://corporateemployeesignin.vercel.app`, `INVITATION_FROM_EMAIL` using an approved/verified sender, and a server-side `RESEND_API_KEY`. See `portal.env.example`. Never put API keys in Vite variables or source control. Test mail only to an approved recipient after configuration.
2. Obtain company-approved HR templates before representing those forms as downloadable. No employment, banking or insurance forms have been fabricated.
3. Release matching frontend and backend revisions. Verify actual Render deployment completion before testing Vercel sign-in and `/api/admin/company-context`; pushing a frontend alone is insufficient.
4. Review existing employee assignments before release. Unassigned employees cannot open an employee workspace. If older unstamped records belong to one company, assign that original company first before adding further companies. Ambiguous legacy records remain visible only to the super admin rather than being shared across companies automatically.
5. New attachments are stored durably in the configured access-record backend. Older files that existed only on an ephemeral Render disk may need re-upload; missing files are reported honestly.
6. Live MongoDB transactions, cloud attachments and real email delivery have not been exercised against production. Regression tests cover SQLite and mocked cloud profile behavior. Keep the current single API process deployment: concurrent timesheet writes are serialized per employee within that process; multiple backend replicas require a distributed lock/transaction before scaling.
