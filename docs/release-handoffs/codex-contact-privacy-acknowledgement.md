# Release Handoff: codex/contact-privacy-acknowledgement

- Status: queued
- Branch: `codex/contact-privacy-acknowledgement`
- Commit: `4b7919a17bcc485fa2ced3ccdadb690805299f94`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Require contact-form users to acknowledge the Privacy Policy before submitting feedback.
- Use the same configurable Privacy Policy destination as the public footer in both contact form locations.

## Verification

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: Contact form, footer contact dialog, and styles/globals.css.
- Expected conflicts: Potential overlap with other changes to the contact form, footer, or shared global styles.
- Rollback notes: revert `4b7919a` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
