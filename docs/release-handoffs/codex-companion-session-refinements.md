# Release Handoff: codex/companion-session-refinements

- Status: ready
- Branch: codex/companion-session-refinements
- Commit: 55a4bda
- Owner/agent: Citra; backend by Nadi
- Bundle priority: curator workflow refinements and authorized mistaken-clearing correction

## Summary

- Global Active move / Staging area / To-do navigation. Phase tabs and vitrine buttons sit together in the guide column; map remains beside it. Visible saint search with start/destination filters; requested helper text removed. Tasks load museum-wide, group by vitrine, and survive phase switches.
- Durable vitrine preparation is distinct from physical staging. Historical clearing remains prepared after filling; confirmed occupants prevent repeated whole-case clearing. New checks require preparation unless placement already started. Existing placements remain usable.
- Server-derived correction offers in staging preview exact previous confirmed names/locations before an explicitly acknowledged atomic correction. Preserves timestamps, exact applicable shelf notes and audit history; no fictional physical return move.
- Optional per-relic Additional saints connected to this relic in More details. Raw text only, no canonical relationship creation. Existing IDs, drafts, submissions and media unchanged; older clients preserve the new field when omitted.

## Verification

- prepare:deployment and dev:check passed.
-27 focused preparation, clear-correction, undo and intake tests passed in integrated feature worktree.
- Browser fixture desktop/mobile: global staging remains available after phase switch; tasks remain accessible/completable across phases; preparation gates new checks and survives refresh; check/undo copies agree; shelf/task save, search/filter, decline alternative, correction preview/save/refresh pass. No horizontal page overflow.
- Intake browser fixture: two relics save separate additional-saint values with original IDs; no phone overflow.
- Nadi's real isolated PostgreSQL16 service test PASS: stale13th entry rolls back whole batch; exact13 restore with original timestamps and shelf3.10;5 source-only entries untouched; original+per-source correction audit retained; repeatedUUID replay safe and alteredUUID/stale retry rejected. Preparation CAS/idempotency/legacy projection also pass. Script scripts/verify-museum-clear-correction.ts refuses any target except127.0.0.1:55438/museum_test. No production database used.
- codex:verify passed on combined code11874ff (existing CSS autoprefixer warnings only). Final two-file preparation-version guard55a4bda passed4focusedtests and final dev:check; release captain owns final integrated build.

## Deploy Notes

- Migrations: none.
- Environment variables: none. Airtable delivery remains disabled.
- Backend commits95503bc/48f2914/9dcb994 cherry-picked as1430f18/499f389/55a4bda, UI6853d88/11874ff. Do not separately integrate originals.
- After ACTUAL live UI/API promotion, notify Nadi to execute the user's explicitly authorized repair via supported UI. Target receipt cmvsc1la500db07mte0555vfu, exact13 previous-confirmed Vitrine2 entries only; leave5 source-only staged entries untouched. User confirmed those13 physically stayed2. Fresh CAS required; any newer change blocks the affected batch, not permission to overwrite.
- Nadi owns live correction/readback and will report batch receipt,13 restored,5 unchanged. This release itself does not execute the repair. Do not claim records fixed from workflow success alone.
- Other reports (Srinivasa/Hemalata/Dhanamamjari) and4/37 guide work are deliberately separate. Gauridasa naming task already verified OPEN by Nadi, no rename.

## Risk And Conflicts

- Shared physical-location routes/service, companion-work service, intake JSON contract/payload, companion component and shared CSS/design docs.
- Preserve the restored-record decoder and correction audit readers after any correction occurs; do not roll back to code that mistakes corrections for physical confirmations. New UI and backend should ship together.
- No broad source/proposal update, no media migration, no canonical additional-saint links.
- Local museum-data-interpretation skill updated/validated by Nadi: readiness, emptiness, physical movement and correcting a record are separate facts.

## Release Captain Notes

- Integrated into main: pending
- Pushed to main: no
- Merged to deploy: pending
- Production workflow: pending
