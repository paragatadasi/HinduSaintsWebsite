# Release Handoff: codex/spn-connections-map

- Status: ready
- Branch: `codex/spn-connections-map`
- Commit: `6220da4`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Add SPN Plan the move with Saarthi's audited connections map and current section counts.
- Save, update, remove and switch named diagram arrangements; original retained; multiselect movement; shared Vrindavan UI.

## Verification

- Final npm run codex:verify passed; dev:check passed; 14 domain/geometry/research tests passed; disposable PostgreSQL saved-view integration passed; browser component save/switch/unsaved guard/group movement/popup and no overflow verified.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: Saarthi v3 research packet with Nadi canonical corrections and neutral current-placement copy. No backfill. Uses existing museum-scoped audit events; no migrations or environment changes.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: MuseumConnectedTraditions renderer, diagram domain and persistence, both plan action files, museum navigation, shared museum CSS.
- Expected conflicts: Integrate Museum Overview 07b7daa first; map branch replaces its temporary /museumadmin/plan redirect. No relationship/source/physical-placement writes.
- Rollback notes: revert `5d80196` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending

## Accepted relationship label follow-up

Nadi confirmed the live, user-approved Influence relationship from Mahendranath
Gupta to Yogananda. The map now uses Influence and preserves the direction and
personal-guidance context (Autobiography chapter 9). Other contextual labels are
unchanged. Data/copy-only follow-up: focused research tests pass (2/2) and diff
check passes; the full feature release build passed before this label update.
