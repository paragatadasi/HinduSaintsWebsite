# Release Handoff: codex/v45-move-guide

- Status: `ready`
- Branch: `codex/v45-move-guide`
- Commit: `d16013bdf25d27a08bd35cfaec1c72c980f36efc`
- Owner/agent: Citra
- Bundle priority: immediate release candidate

## Summary

- Add West / Vitrine 45 to the move companion and room navigation using the approved Western v9 subset.
- 21 holding observations remain actionable; the Namdev reference appears separately without a checkbox or progress count. Three optional additions are labelled to place last.
- Retain current physical origins, later curator destinations, living-status evidence and fit caveats. Availability confirmation never clears the case or records a shelf.
- Includes Nadi's domain branch through 753533e; do not deploy that backend separately. V1 is separate work and must not delay this release.

## Verification

- `npm run codex:verify`: passed on final committed code (initial restricted build hit Windows EPERM; normal-access rerun passed).
- `npm run prepare:deployment`: passed.
- 28 focused V45, assistant authorization, alternative destination and addition-projection tests: passed.
- Real-component browser fixture: 21 checklist holdings, separate anchor, three optional badges, availability acknowledgment, single V45 placement with no shelf, no whole-case clear request, mobile width and family labels passed. No production writes used for testing.
- Desktop screenshots reviewed in companion-parchment-qa/v45.

## Deploy Notes

- Migrations: none.
- Environment variables: none. Airtable delivery remains disabled.
- Data/backfill: checked guide packet only; no physical placement or identity changes.
- Verify authenticated `/museumadmin/move?phase=west45&vitrine=45` shows West, Vitrine 45 and the guide. Native saved proposal data alone does not prove this interface is deployed.
- Source-only Dhunda retains the guide's approved destination without an invented identity; the stricter assistant destination gate may require a curator for that exception.
- Known load remains about 5.37 of 5 shelf spaces plus two unmeasured holdings; the three optional entries are not guaranteed to fit.

## Risk And Conflicts

- Shared areas: companion page/navigation, guide types and rendering, registered guide domain and physical-write validation.
- V45 ordinary roster checks remain strict; separately validated curator additions and alternative decisions use the existing guarded paths.
- Preserve existing curator records. Standard code rollback; no data rollback required.
- Skill review: existing museum evidence/planning rules cover this workflow; no reusable rule changes needed.

## Release Captain Notes

- Integrated into main: pending.
- Pushed to main: no.
- Merged to deploy: pending.
- Production workflow: pending.
