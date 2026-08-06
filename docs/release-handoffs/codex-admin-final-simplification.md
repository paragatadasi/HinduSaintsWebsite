# Release Handoff: codex/admin-final-simplification

- Status: ready
- Branch: `codex/admin-final-simplification`
- Commit: `5f1d4792ba2759a66e5054530bb45a7ea2582ce7`
- Owner/agent: `aporu`

## Summary

- Replaces the all-at-once workload dashboard with URL-backed My Work,
  Available, Blocked, Completed, and Team queue tabs that expose one focused
  queue at a time with `aria-current="page"`.
- Moves assignment creation into a compact, session-persistent collapsible card
  and adds shared stacked, inline, field-grid, option-toggle, and form-footer
  layout primitives so assignment and access forms do not stretch across the
  page or create nested card noise.
- Makes Users & Access summary-first: new-user approval, each approved user's
  roles, the sensitive-action password, and access history expand only when
  needed. Updated users reopen automatically after save.
- Completes the user-facing rename from bulk/delete/destructive-action password
  to sensitive-action password across Saints, Instagram, Airtable, error
  messages, and runbooks. Internal field/function names remain unchanged for
  compatibility.
- Updates the durable admin-overhaul workflow to record R4 as deployed and R5
  as ready for release.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (100 tests)
- `npm run codex:verify`: compiled, type-checked, collected page data, and
  generated all 15 static pages; exited nonzero only during the known Windows
  junction `EPERM` while copying standalone build traces.
- Local browser verification: the protected route loaded and correctly stopped
  at the sign-in boundary. No credentials were entered, so authenticated visual
  QA was limited to implementation/DOM/CSS review plus the checks above.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none

## Risk And Conflicts

- Shared areas touched: `styles/globals.css`, `/admin/work`, `/admin/users`,
  sensitive-action error/label copy in Airtable, Instagram, and Saints, and
  admin-overhaul/import runbooks.
- Expected conflicts: possible only if another branch edits the same shared
  admin form styles or the same Work/Users page markup. No data contracts,
  authorization checks, server-action behavior, or database schema changed.
- Rollback notes: revert `5f1d479` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
