# Employee Portal Changes — current handoff

Updated 29 September 2026 after resuming the interrupted document implementation. The earlier unfinished vendor/document/profile tasks are now implemented and checked. See `portal-changes-checklist.md` for the ordered requirement-by-requirement record.

## Current state

- All requested application screens and backend workflows are implemented locally.
- 42 automated tests pass; production build and error-level lint pass. Browser checks passed using isolated synthetic accounts. Follow-up tests verify username/password access, revoked companies, and domain-admin email content.
- `https://corporateemployeesignin.vercel.app/` is now a valid production alias on the existing Vercel project. It currently displays the old deployed release.
- No application commit, push, or deployment has been made for this continuation. Latest previously pushed commit remains `816f624`.
- No production employee records, admin credentials or real invitation emails were changed.
- Add Domain Admin includes first/last name, email, and multiple company checkboxes. The email confirms the selected companies and includes a one-use activation link; confirmation names the recipient and companies. The email adapter was tested with a simulated provider, not a real send. All three email configuration variables are still absent locally.

## Next specific task: production configuration and release

1. Obtain an approved, verified invitation sender and configure the three variables in `portal.env.example` on Render. The sender API key belongs in the hosting secret configuration, not chat, frontend or Git.
2. Obtain HR-approved employer-specific forms (agreements, ACH/direct deposit, insurance and emergency contact templates) for the remaining form links.
3. Review employee company assignments and legacy records using the checklist's migration guidance.
4. Review and commit the scoped changes; preserve the pre-existing design/portal edits and exclude secrets, source documents and temporary testing artifacts unless deliberately included.
5. Push and deploy the same application revision to Render and Vercel. Verify signed-in production super-admin, scoped-admin and employee flows on the new general URL. Test an approved invitation recipient end to end, including MongoDB registration and private attachments.

The latest resume request asks for completion; the old 30-minute interrupted-work limit is not an active instruction. Do not treat this handoff as permission to send real emails, fabricate HR forms or claim live deployment has already occurred.
