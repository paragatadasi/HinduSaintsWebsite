# Release Handoff: codex/museum-intake-save-recovery

- Status: deployed
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
- Environment variables: None in this branch. Intake photos intentionally use the existing public `MEDIA_STORAGE_BACKEND` / `MEDIA_UPLOAD_ROOT` configuration and ordinary `/media/...` URLs; authenticated intake records, uploads, edits, submissions, and reviews remain protected. Airtable delivery and website delivery stay disabled.
- Data/backfill/release steps: Existing drafts are preserved. Existing submitted entries without a bio document must have one added by the curator or be returned for correction before approval. Approved entries remain unchanged.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Intake component/domain, shared form guard/route progress, globals CSS, museum workspace docs.
- Expected conflicts: Mira public-media branch overlaps HTTP fixture and museum workspace docs: preserve public-media assertions plus bio_document fixture.
- Rollback notes: revert `c6fb61a` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: `d31f981` (joint UI recovery, bio-document migration, and public-media storage release)
- Pushed to `main`: `13951e8`
- Merged to `deploy`: `29a503f`
- Production workflow: [40500244301](https://github.com/paragatadasi/HinduSaintsWebsite/actions/runs/40500244301) — success

## Integrated Verification

- `npm run dev:check`: passed.
- Full test suite: 588 tests, 587 passed, 1 skipped.
- Focused intake/storage/privacy tests: 11 passed.
- `npm run codex:verify`: compiled, type-checked, collected page data, and generated all 22 static pages; the final standalone trace-copy step hit the known Windows worktree `EPERM` while creating a Next.js font directory. This is the same environment-only limitation recorded for prior releases; the feature branch's clean production verification passed.
