# Release Handoff: codex/spn-east-north-version-label

- Status: queued
- Branch: `codex/spn-east-north-version-label`
- Commit: `7731ced`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Preserve the East–North naming sequence and import the approved regional refinement as East–North v4 (research packet Sikh–North v3). Open this newest revision by default; retain all older studies and manual comparison selection.
- Apply the five South-highlight allocations plus 82 tertiary city allocations. Preserve 1,423 source observations, three named holdings, source evidence and protected object constraints.
- Show regional stories and provisional city cohorts in the vitrine inspector using existing disclosure styles. Current curator decisions continue through the existing reconciliation reader; no database writes.
- Research handoff and manifest verified after correcting stale v1 references in the provided v3 handoff. Importer rejects mismatched layout/handoff revisions.

## Verification

- `npm run dev:check`: passed
- `npx tsx --test lib/spn-room-regional-refinement.test.ts`: 5 passed
- `git diff --check`: passed
- Integrated production build and authenticated visual review remain release-captain gates.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: SPN plan loader, explorer inspector, versioned proposal/design JSON, packaging script and regression tests
- Expected conflicts: concurrent SPN proposal loader or explorer changes require review
- Rollback notes: revert `7731ced` to return to the previous allocations/default; naming changes are separate

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending


