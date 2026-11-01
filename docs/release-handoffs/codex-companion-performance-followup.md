# Release Handoff: codex/companion-performance-followup

- Status: ready
- Branch: `codex/companion-performance-followup`
- Commit: `603b89eb643a5e893b3fe1961e0862376f07e5e7`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Consolidated PR3 fast follow: scoped shared shelf/catalog reads, selected-guide-first streaming and indexed row lookups

## Verification

- dev:check passed; codex:verify production build passed; npm test 971 passed, 1 skipped; 3 browser checks passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Museum companion page/components and admin performance guidance
- Expected conflicts: Requires codex/museum-read-performance in the same release; do not deploy client alone
- Rollback notes: revert `603b89e` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending


## Consolidated bundle

- Baseline: integrated PR #3 main `88cedab` (incident deploy succeeded separately).
- Required backend: Nadi's `codex/museum-read-performance`, with its ready handoff and exact SHA. Integrate backend first, then this client branch. Do not ship the client without scoped shelf responses and `availableVitrines`.
- This branch includes the shared performance guidance/index changes `946768c` and source audit `5118ad2` as well as runtime commit `603b89e`.
- Current endpoint compatibility: no shelf query retains the legacy full context; the client uses `?vitrine=CODE`. ETags are resource/scope-specific; a 304 reuses the matching local value. The cache lives in the mounted page, never a shared client/global store. Writes remain uncached and invalidate read results.
- Guide loading now streams remaining rows into the mounted selected guide; no extra whole-museum request is introduced. Initial museum/physical reads and background guide building still occur.
- No production data changes, migrations, new dependencies or environment variables. Airtable delivery is unchanged.

## Evidence and limits

- `npm run dev:check`: passed.
- `npm test`: 972 tests, 971 passed, 1 existing skip.
- `npm run codex:verify`: passed (compilation, types, 29 static pages and final output). Initial restricted attempt failed creating a generated `.next/types` directory; the allowed rerun completed. Existing CSS autoprefixer warnings remain; this branch changes no CSS.
- Chrome checks: shared scoped shelf reads and late-response rejection; selected-guide streaming preserves mounted editor/unsaved input; actual search still supports adding and confirming a move.
- Browser evidence scripts in Citra's `companion-parchment-qa`: `shelf-read-check.cjs`, `stream-check.cjs`, `move-policy-check.cjs`. Streaming probe tests the wrapper lifecycle, not authenticated server navigation.
- Backend evidence reported by Nadi: concurrent catalog/shelf reads 48 queries and 1 source load versus baseline 222 queries and 5 loads; selected shelf payload 14,207 bytes versus 750,329; unchanged read 1 query/0 loads. Verify against the final backend handoff.
- No production latency claim. Authenticated live checks should cover opening a saved vitrine link, switching rows, two curators updating independent entries, same-entry conflicts, and keeping unsaved shelf/to-do text during refresh.
- Broad tree virtualization/lazy mounting remains profiling work, not an unverified change in this bundle.

## Rollback

Standard code rollback of this bundle; no data rollback. Preserve all recorded moves and drafts. Backend's legacy full-context shelf response remains supported.
