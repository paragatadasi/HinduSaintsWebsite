# Release Handoff: codex/spn-west-v1-domain

- Status: ready
- Branch: `codex/spn-west-v1-domain`
- Commit: `80266c6999c5ba09179cd0fae18864e237e4d2b1`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Register the approved V1 subset: four BAPS records, eight Gondal observations and seven Amreli observations. Preserve source-only identity, possible overlaps, live origins and newer curator destinations.

## Verification

- `npm run dev:check`: passed
- 20 focused V1 guide/registry/assistant tests: passed
- `npm run prepare:deployment`: passed
- Production build: Citra owns combined UI/domain verification; no standalone production build claimed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready when bundled with the V1 interface; V45 remains first priority.
- Guidance: BAPS top two shelves, living Mahant shelf 2; Gondal/Amreli geographic groups below. Availability preparation only, no whole-case clear. Ordinary guide confirmations omit shelf.
- Fit: 4.966667 / 5 source-observation comparison, not certified dimensional fit. Possible overlaps stay separate; source-only Gondal remains curator-only while the global reviewer still has 62. Eight retained destinations in 60 and Brahma Kumaris pending are untouched.

## Risk And Conflicts

- Shared areas touched: lib/spn-starter-guide-registry.ts, lib/museum-physical-locations.ts, docs/museum-move-companion.md; new scoped packet/guide/source/tests.
- Expected conflicts: V45 integration touches the same registry, transaction insertion point and documentation end. Retain both phases and V45 curator addition/alternative exclusions. Bundle with Citra V1 UI after V45; V1 must not delay the V45 release.
- Rollback notes: revert `80266c6` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
