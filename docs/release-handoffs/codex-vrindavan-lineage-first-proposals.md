# Release Handoff: codex/vrindavan-lineage-first-proposals

- Status: ready
- Branch: `codex/vrindavan-lineage-first-proposals`
- Commit: `ebbae7d4dc3c211a1623a5a7c410dc90365a12df`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Add guarded Vrindavan lineage-first section reconciliation, exact family-anchor review, private current-state/before-after exports and explicit audited bulk apply.
- Expose six regional roots and conditional supplementary context while preserving earlier section URLs, subgroup/family IDs, curator proposals and exact saved destinations.

## Verification

- `npm run dev:check`, `npm run prepare:deployment`, and `npm run codex:verify`: passed.
- 14 policy/navigation/working-domain tests passed. Guarded disposable database integration passed, covering actual apply, stale revisions, exact family anchors, idempotence, protected later edits, and unchanged identities/geography/SPN/physical records.
- Production build emitted only existing CSS autoprefixer warnings. No authenticated production UI test of these new routes before release.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: no automatic production writes. Verify actual private rollout (not dispatch alone), export fresh current-state to Saarthi, review exact family anchors against current membership and inspect before/after coverage before explicitly applying eligible proposals. Then export resulting counts. Existing identity save rollout remains a separate live verification checkpoint.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: shared MuseumSaintPlacement optional arrangementNeedsReview, section navigation and overview; Vrindavan working/proposal adapters; main-admin museum source routes; integration docs. No planner, schema, migration or style files touched.
- Expected conflicts: based on 9491d62, behind newer Citra planner/catalogue releases; integrate additively and preserve their appended docs. Citra has received the six-root catalogue and arrangementNeedsReview contract. Original SPN navigation defaults remain unchanged.
- Rollback notes: revert `ebbae7d` and dependent release code; retained ExternalRecord proposal/anchor snapshots and audit events must not be deleted. Reverting the overlay restores the inherited projection without rewriting physical or curator records. No live section apply has been performed at handoff.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
