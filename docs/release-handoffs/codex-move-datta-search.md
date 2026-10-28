# Release Handoff: codex/move-datta-search

- Status: ready
- Branch: `codex/move-datta-search`
- Commit: `facf39a26c7452845944c3ab521cf3d81e47cefd`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Add locked Datta phase and filtered saint search to parchment move guide

## Verification

- dev:check passed; 12 focused tests passed; browser search/filter/phase/mobile checks passed; codex:verify PASS (production build, elevated after Windows output permission error)

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Move route, companion/tree UI, guide registry and physical-scope validation, globals
- Expected conflicts: none
- Rollback notes: revert `facf39a` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending

## Release scope

- User explicitly requests Datta and search deployed after starter UI. Starter stays default; /museumadmin/move?phase=datta opens the new locked phase.
- Includes Nadi contract commit15266f6 (48 exact source observations; vitrines3/81/82), corrected v2 living evidence. No canonical relationship edits, no proposal baseline overwrite and no recorded physical moves.
- Per-phase search: name, starting source vitrine, proposed destination; each result shows region/section and distinct confirmed current location if present.
- Datta disallows whole-case clearance/staging/alternative targets server-side. Forty outgoing dependencies stay separate; unknown starts are not invented.
- No migrations, environment changes, backfill or Airtable delivery. Preserve earlier ledger confirmations and curator overrides.
- Expected integration overlap: starter UI already integrated on main5e3f449; this branch includes that ancestry plus existing Nadi tier/concept work. Preserve release cleanup of old handoffs.
- First build attempt hit Windows EPERM on generated .next directory; rerun elevated. Public dispatch success alone does not establish private hosting completion.

