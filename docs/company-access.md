# Company workspaces and admin access

Each employee has one company assignment. The five company IDs and display names
are in `client/src/utils/companyCatalog.js`; the server uses this same catalog.
Country and payroll currency remain separate from the employee's company.

## First use

1. Sign in with the existing primary administrator (`ADMIN-001`). This account is
   the initial super admin. `SUPER_ADMIN_EMPLOYEE_ID` can designate a different
   existing admin account at deployment; do not change it casually.
2. Open **Super Admin → Employee companies**. Existing employees and new
   self-registrations start **Unassigned**, visible only to the super admin. Select
   employees and assign their actual company; no companies are guessed from country.
3. Open **Administrators** to create admin accounts and check their allowed companies.
   Existing non-primary admin accounts have no access until explicitly enabled here.
4. Use the company selector above every admin page. **All employees** means all five
   companies for the super admin, and only granted companies for other admins.

Admin-created employees have a company field. Company reassignment is reserved for
the super admin. Reassignment moves access to the employee's entire existing
profile, documents, timesheets and payroll history; records are not duplicated.
Historical legal-employer snapshots are not implemented.

## Enforcement and persistence

- The server checks current grants and employee assignments on every authenticated
  admin request. JWT claims never grant super-admin or company access.
- Reads, edits, invoice/payroll operations and document/timesheet downloads check
  employee ownership. List responses and summaries exclude inaccessible employees.
- Settings, global audit logs and company/admin management require super-admin access.
- A grant change or disabled admin is enforced on the next API request. The browser
  refreshes access every 30 seconds, on focus and on denied requests, clearing old
  views when permissions change. Previously downloaded files cannot be recalled.
- Company changes clear employee/detail state while retaining the current admin page.
- Company assignments, grants and their change history use MongoDB when configured;
  otherwise they use SQLite's `company_access_records` table. A configured cloud
  outage fails closed rather than switching to stale local permissions.
- The primary super admin cannot be disabled or have company access removed in the UI.

Deploy the frontend and backend together. Configure a private, stable `JWT_SECRET`;
without one, the server uses a random process secret and sessions expire on restart.
Existing credentials remain valid only if they match their stored password hash:
universal fallback passwords were removed. The old public reset-token issuance was
unsafe and has been disabled; verified email recovery is not configured. Account
recovery currently requires an operator to reset the stored account credentials.
Registration uploads now require signed receipts, so an in-progress registration
from the old frontend must re-upload its documents.

## Verification

Run `node --test server/companyAccess.test.js server/invoice.test.js server/payrollInformation.test.js`
and `npm --prefix client run build`. Access tests use isolated in-memory SQLite and
an ephemeral HTTP server, never real employee assignments or administrator grants.

## Example administrator setup

`node server/scripts/setup-example-admins.mjs` explicitly creates two example
administrators alongside the existing super admin. It generates unique passwords
in `example-admin-credentials.local` (Git-ignored), verifies sign-in and company
scope, and never resets an existing password or changes existing company grants.
Admin 1 starts with companies 1 and 5; Admin 2 starts with companies 2, 3 and 4.
Cloud copies are suspended until the new backend is deployed, because older backend
versions do not enforce company grants. Local copies remain enabled for testing.
After deploying both backend and frontend, open each example admin under Super Admin
and disable/save, then enable/save to activate the cloud account through the new
access-management endpoint. Do not activate these accounts on the old backend.
