# Release Handoff: codex/museum-intake-save-recovery

- Status: ready
- Branch: `codex/museum-intake-save-recovery`
- Commit: `c6fb61a3150fc2715fe108447c41c81b2c5672d6`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Recover failed photo uploads, clarify saved drafts, avoid redundant draft writes and cancel phantom navigation progress.
- Require Bio document photo below description; show curator drafts in a separate queue beneath review entries.

## Verification

- dev:check passed; seven focused tests passed; disposable DB migration and intake persistence/concurrency/ownership/approval tests passed. codex:verify passed after stopping local preview and using a clean build directory; existing CSS autoprefixer warnings only.

## Deploy Notes

- Migrations: 20261027180000_museum_intake_bio_document extends media kind constraint; apply during release migration phase.
- Environment variables: None in this branch. Bundle with Mira public-media storage fix; Airtable delivery stays disabled.
- Data/backfill/release steps: Existing drafts are preserved. Existing submitted entries without a bio document must have one added by the curator or be returned for correction before approval. Approved entries remain unchanged.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Intake component/domain, shared form guard/route progress, globals CSS, museum workspace docs.
- Expected conflicts: Mira public-media branch overlaps HTTP fixture and museum workspace docs: preserve public-media assertions plus bio_document fixture.
- Rollback notes: revert `c6fb61a` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
