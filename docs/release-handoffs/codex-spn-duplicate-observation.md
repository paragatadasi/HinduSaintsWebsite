# Release Handoff: codex/spn-duplicate-observation

- Status: ready
- Branch: `codex/spn-duplicate-observation`
- Commit: `9d5c0821db2419de5dd59da839ec04deb75f1b7d`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Add Proposed versus Already moved alternatives; project current declines into reviewer and guide without inferring physical moves
- Show existing record to-dos; add guarded historical-staging review UI; suppress one duplicate source observation reversibly

## Verification

- dev:check passed; codex:verify passed; unit suite 698 pass/1 skip plus 2 new phase-ownership guard tests passed; real-component browser checks passed including partial-save recovery, historical payload, existing to-dos and mobile/navigation regressions

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No migration or backfill: existing saved declines are projected at read time, and newer SPN arrangement events take precedence. Nadi owns separately authorized historical staging repair after deployment. Preserve every physical receipt, raw import, canonical saint and existing task.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: SPN reviewer/companion routes, physical-location confirmation, guide decisions, museum working data/readers
- Expected conflicts: Must bundle codex/spn-historical-staging at 34d1b98 for its endpoint. Includes queued codex/museum-case78-note ancestor; mark that handoff released too. No schema or environment changes.
- Rollback notes: revert `9d5c082` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending

## Live reconciliation audit and post-deploy readback

- Nadi's read-only audit found two starter-v5 row alternatives, both Vitrine 76 -> 29: rec1rr4Ktv320QXvd and rec8kLoCs2julYZOc. The five other checked active guide versions had no decisions. This is not an audit of every historical version.
- After deploy, verify the effective alternativeDestinations from the authenticated guide-decisions endpoint, the reviewer, and the starter guide. If a newer SPN arrangement wins, report the conflict rather than overwriting it.
- No decline is treated as a physical confirmation. Older declines remain proposed, including those saved during deployment.
- The historical staging disclosure depends on Nadi's endpoint. Nadi owns the separate authorized repair and final readback; do not replay a whole-case clear or duplicate that write.
- Source rec419YldTnqJc6lM is suppressed only as a duplicate observation of recL5wb5a9ffIoqO9. Raw evidence, canonical identities, physical receipts and the existing retained-record to-do remain intact.
- Skill review: existing museum evidence/physical-state distinctions cover this workflow; no reusable skill rule changed.

## Readiness feedback follow-up

- Placement checkboxes now explain missing preparation and focus the relevant confirmation area instead of silently ignoring clicks. Covers family trees, city groups, and final checklist. No physical write is sent until preparation is complete; all other edit guards remain.
- Local real-component browser checks passed for Vitrine 73 readiness, fixed-object transfer prerequisites, undo relocking, and mobile layout.

## Starter cleanup follow-up

- Add the seven curator-supplied cleanup items in a compact starter-phase disclosure, with qualified destinations and identity holds preserved.
- Exact-source partial-move tags for Balak Sadhu and Sachinandan appear in cleanup and checklist. This is a component-completion note, not a physical status rewrite; all receipts and saved proposals stay intact. No database or environment changes.
- Nadi confirmed exact source mapping. Skill review found no new reusable interpretation rule; the existing partial-assembly/physical-evidence distinction applies.
