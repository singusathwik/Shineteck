# Login and employee company access — 29 September 2026

The login username is an email address or employee ID. Passwords are checked against the stored hash; roles and company assignments come from server records, never submitted login fields.

Follow-up changes:

- Labeled and connected the Username and Password fields explicitly.
- Invalid credential payload types now return a validation error rather than a server error.
- Employees with no enabled company assignments cannot open a workspace; they receive a contact-administrator message.
- Employee permission denials refresh the company selector, as administrator denials already did. Company-context requests are excluded to avoid refresh loops.

Verified using isolated HTTP tests:

- Email and employee-ID sign-in, including case and surrounding whitespace.
- Wrong passwords and unknown usernames produce no authentication token.
- Client-supplied administrator flags and company IDs cannot expand access.
- Multi-company employees receive only their assigned enabled company choices.
- Unassigned company requests are rejected for profiles, document lists/uploads, timesheets and vendors.
- Multi-company uploads and submissions require a specific company.
- Removing an assignment immediately blocks that company's requests with the existing token. Removing all assignments blocks the workspace.
- Invitation registration rejects an unassigned company and preserves the administrator's assigned companies.
- Existing tests verify personal-profile persistence, document upload/download ownership, and timesheet creation and review.

Result: 40 automated tests passed, production build passed, lint reported no errors, and Git whitespace validation passed. Existing lint/build warnings remain. This check did not send invitations or change production accounts. Live email delivery and deployment remain separate pending steps.
