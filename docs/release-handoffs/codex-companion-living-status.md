# Release Handoff: companion living status

- Status: `ready`
- Branch: `codex/companion-living-status`
- Commit: `2d806192ea39d9a08afeb9055cc294583b230ef9`
- Owner/agent: Citra
- Bundle priority: restore curator living-status cues

## Summary

- Catalog search uses the existing current-evidence living-status projection. Search additions retain life metadata rather than replacing it with an untagged entry.
- Still alive / May be alive use existing compact badge styling across shelves, family trees, checklist and search. Shelf cards no longer rename Still alive to Living.
- Existing >100-years rule remains: suppress uncertain May be alive only; retain explicit Still alive, veto when samadhi year recorded, invent no status from missing dates. No data rewritten.

## Verification

- dev:check and prepare:deployment passed.
- 13 focused life-status/addition tests passed (century boundary/ranges, explicit living, recorded death, ambiguous identity, preservation through additions).
- Actual-component mocked browser search/save scenario preserved Still alive after addition; no production writes.

## Deploy Notes

- No migrations, environment changes, backfill, or physical writes. Airtable unchanged/disabled.
- Descends from already released companion-source-review-context.
- Ready now; performance work is separate and should not block these labels.

## Risk And Conflicts

- Shared areas: catalog reader, life-status helper, companion parent/search/tree/shelf.
- Pending Nadi Paramanand exact-source contract may overlap catalog; preserve both changes when bundling.
- Standard code rollback, no data changes.

## Release Captain Notes

- Integrated into main: pending
- Pushed to main: pending
- Merged to deploy: pending
- Production workflow: pending
