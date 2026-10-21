# Release Handoff: codex/museum-ramaiah-guide-confirmation

- Status: ready
- Branch: `codex/museum-ramaiah-guide-confirmation`
- Commit: `612c855a0ee6e2ec48b498388a8b19f6f9f25d8f`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Guide v13 has73 connections/21groups: add directly confirmed Ramaiah Tamil-Kriya context and Bhakti Vilas discipleship; clear only those2 identity holds.

## Verification

- dev:check passed;18 domain/adapter tests passed, preserving previous71/72 semantics, all73 graph case IDs, contextual holdings protection and remaining3 holds; git diff --check passed. Existing data-driven UI unchanged; release captain owns integrated codex:verify.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No schema/migrations/env or production data writes. Direct collection confirmations from Paragata relayed in Saarthi guidev13/alignmentv5 are recorded in case notes. Ramaiah remainsV24; no Vilas destination inferred. Saved current placements override dated guide baseline04:33:40Z. After actual runtime promotion Nadi should verify guideVersion13,73 dispositions and typed cases ramaiah-tamil-kriya-001 / bhakti-vilas-tirtha-disciple-001.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Private guide manifests, domain import, regression tests and documentation.
- Expected conflicts: Depends on integrated71 follow-up. Supersedes previous Ramaiah hold and Vilas affiliation-only hold; Narayan462,Narayan431,Ramdas145 remain held. No Yogananda discipleship inferred. Deploy confirmation requires actual runtime/export, not dispatch-only success.
- Rollback notes: revert `612c855` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
