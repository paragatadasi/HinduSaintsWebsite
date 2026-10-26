# Release Handoff: codex/spn-sikh-north-review

- Status: ready
- Branch: `codex/spn-sikh-north-review`
- Commit: `94267ca6e37e1749b0d55a3935118131522d554f`
- Owner/agent: Citra
- Bundle priority: immediate release candidate

## Summary

- Add Sikh–North connections v1 as a separate selectable curator-review candidate, using Saarthi's cleaned approved review packet. Preserve all existing candidates, earlier studies and default selection.
- Uniform source recMo8X6ehasAq0cW is proposed in 18; distinct spade source rec6IqZR7ahPTDfEI remains proposed in 64. Neither is a completed physical move.
- Rebuild all 82 indicators from actual allocations. Protect 17/18/23/30/31/64/68/69/70; show conditional mounting, clearance and reuse notes. 69 is not a confirmed vacancy.
- Correct inherited packet/driver labels (Buddhists25, uniform18, Datta81/82) and preserve distinct thematic versus personal connections.

## Verification

- `npm run prepare:deployment`: passed.
- 13 focused tests: passed (Sikh candidate, East–North allocations, Sankaranya correction, current curator overrides).
- 1423 unique source observations, 303 recorded source-shelf shares, 3 named-only holdings preserved; source identities, states, raw locations, tiers and baselines unchanged.
- 99 reviewed relationship pairs checked for newly split previously co-located endpoints; no new split.
- Nadi read-only production preflight 2026-10-26T15:51:08.900Z: zero editorial/tier/placement/source/scoped-decision/arrangement drift versus the packet baseline. New Sankaranya relationship included in reviewed99 pair set.
- Exact uniform18/spade64 guards, walking-stick destinations retained; no capacity inferred from null full-height footprints.
- Actual production component browser preview: seven options, unchanged default, switching across candidates, vitrine-specific uniform and conditional69 notes, desktop1440/mobile390, no page errors or horizontal overflow.
- `git diff --check`: clean.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none; proposal JSON addition only, with live record reconciliation on read. No production database writes.
- Shared areas: `app/museumadmin/plan/page.tsx` adds candidate imports/entry; `components/admin/spn-room-explorer.tsx` adds candidate label. No auth or routing behavior changes, CSS changes, or package changes.
- Based on fetched origin/main `5cbefd7`. Does not modify the existing East–North fixtures; compatible with the separate northern-continuity branch.
- No geographical pilgrimage candidate included. This is review publication, not adoption or execution of the plan.
- Release captain owns integrated production build and deployment verification.

## Evidence

- Research packet: `spn-sikh-north-connections-2026-10-26-v1-handoff.json` in Saarthi's outputs directory; hashes recorded in packaged provenance.
- Fresh preflight: Nadi's `spn-readiness-2026-10-24/sikh-proposal-preflight-2026-10-26/packet-preflight.json`; hash/date recorded in packaged provenance.
- Local visual review: `http://localhost:8800/sikh-north-preview.html` (recorded-baseline preview, not live database).
- Skills reviewed: museum-planner, museum-data-interpretation, UX writing. No reusable interpretation rule change needed; proposal-specific housing restrictions remain in proposal data.

## Risk And Conflicts

- Expected conflicts: candidate-registration lines if another feature edits the same registry; retain all entries and the existing first/default entry.
- Mounting and dimensional-fit checks remain open for special housing, especially 17/70 and conditional68. Equal case height is not complete fit certification.
- Rollback: revert `94267ca` and this handoff; existing candidates remain.

## Release Captain Notes

- Integrated into main: pending
- Pushed to main: no
- Merged to deploy: pending
- Production workflow: pending
