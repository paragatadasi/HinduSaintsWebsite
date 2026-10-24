# Release Handoff: codex/spn-source-link-repair

- Status: ready
- Branch: `codex/spn-source-link-repair`
- Commit: `e83880209cd65e0aaf029ca68f78c861ccfec54a`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Repair missing ExternalRecord links for explicitly reviewed SPN source matches using the preserved mirror payload and timestamps.
- Retain occupied, archived/dangling and wrong-type link protection; enforce the existing fresh review and source hash checks.

## Verification

- `npm run prepare:deployment`: passed (dev:check and handoff generation).
- `npm run codex:verify`: passed; all 19 static pages generated. Pre-existing CSS autoprefixer warnings only.
- Six source-review/update domain tests passed.
- `scripts/verify-museum-source-link-repair.ts` passed against a disposable localhost PGlite database: restoration/provenance, placeholders, replay, stale form/source, occupied/archived/dangling/wrong-type links, invalid target, absent mirror, museum scope and unrelated data preservation.
- `git diff --check`: passed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: no automatic writes. After actual promotion, Nadi resumes authorized clear links through the existing admin UI. Please notify Nadi directly on completion.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: lib/museum-source-review-service.ts, docs/museum-data-integration.md; new guarded integration script.
- Expected conflicts: none known; retain other agents' documentation additions. Uses an isolated real node_modules installation, not a junction.
- Scope limitation: this only supports genuinely absent links and ordinary empty placeholders. It does not reassign occupied links, merge saints, create saints, or stage new section recommendations for the 24 later additions.
- Rollback notes: revert `e838802` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
