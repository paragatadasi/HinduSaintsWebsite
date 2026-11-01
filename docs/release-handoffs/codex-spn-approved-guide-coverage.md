# Release Handoff: codex/spn-approved-guide-coverage

- Status: ready
- Branch: `codex/spn-approved-guide-coverage`
- Commit: `ae0329dc35e89772172274a256a68e3de53e1fc9`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Add approved Maharashtra guides and shelf recommendations for physical vitrines 47, 58, 60 and 61 (70 sources).
- Put reviewed vitrine headlines above search; preserve later destinations, holds and physical records.

## Verification

- dev:check passed; 27 focused tests passed; codex:verify passed on elevated retry after sandbox EPERM; exact 70-source native readback matched.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: Nadi completed proposal-only native updates: 66 changed, 4 already target. No migration, backfill or physical write. Gopal46, Kamaal62 and Devakinandashrama Southern pending preserved. Concurrent Bhoja Bhagat placement39 retained. V43 needs fresh space check after roster change. Hinge and remaining shelf expansion excluded.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Move page, receiving guide registry, physical confirmation validation, navigation, shelf aggregation, shared vitrine heading.
- Expected conflicts: Integrate independently of pending hinge/remaining shelf expansion. Verify live case counts 47=17,58=12,60=21,61=20 and all70 shelf rows without recording moves.
- Rollback notes: revert `ae0329d` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
