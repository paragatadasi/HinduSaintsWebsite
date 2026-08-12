# Release Handoff: codex/privacy-feedback-fingerprint

- Status: queued
- Branch: `codex/privacy-feedback-fingerprint`
- Commit: `782c4e93143d3f3fb035f8eab98462195a8ac575`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Stop attaching persistent IP-derived abuse fingerprints to feedback records.
- Preserve the five-attempt, rolling ten-minute feedback limit with secret-keyed fingerprints held only in server memory and pruned once per minute.
- Scrub existing database values and null-guard the compatibility column while the previous application version may still serve requests during rollout.
- Document the feedback abuse-protection behavior and cover the limiter with focused tests.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed, 147 tests
- `npm run codex:verify`: Prisma generation and the optimized production compilation passed; the build reached final page-data collection but could not complete because the workspace disk filled (`ENOSPC`). TypeScript passed independently in `dev:check`.

## Deploy Notes

- Migrations: `20260812120000_scrub_feedback_abuse_fingerprint` drops the obsolete fingerprint index, clears all stored values, and adds a temporary trigger that forces any old-version writes to `NULL` during the pre-replacement migration window.
- Environment variables: none
- Data/backfill/release steps: apply the migration in the normal migrate/release phase. A later cleanup release may remove the ignored compatibility column, trigger, and trigger function after this application version is confirmed live.
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: feedback server action, Prisma `FeedbackSubmission`, migrations, and analytics/privacy documentation
- Expected conflicts: branches that also change `app/contact/actions.ts`, the `FeedbackSubmission` model, or feedback migrations
- Runtime risk: the limiter is per application process and resets on restart. This matches the current single-app deployment; a horizontally scaled deployment should use a shared ephemeral limiter.
- Rollback notes: reverting the application is compatible with the retained nullable column, but the rollout trigger will keep legacy database fingerprints null. Historical fingerprint values cleared by the migration cannot and should not be restored.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
