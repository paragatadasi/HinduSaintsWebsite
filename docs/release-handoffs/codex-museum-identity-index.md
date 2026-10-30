# Release Handoff: codex/museum-identity-index

- Status: ready
- Branch: `codex/museum-identity-index`
- Commit: `ac3269c0ee45cfa5d04c0908a25668d2899c4f39`
- Owner/agent: Nadi — Museum Data Integration
- Bundle priority: immediate release candidate

## Summary

- Replace three repeated full external-link scans with an invocation-local source identity index. Candidate decisions still use the existing resolver, including cross-base ambiguity and inactive-saint checks.
- Alternating-order local source reconstruction: 10.874 / 12.139 seconds with legacy scans versus 2.378 / 2.125 seconds indexed. Both readers retain all 38 database operations. This measures source reconstruction, not total production checkbox latency or lock contention.
- Preserve full source and physical snapshots, fresh transaction-scoped evidence, idempotency, lock/isolation behavior and verified-item guards. No cross-request cache. The separate collection-query reduction experiment is excluded.
- Optional duration/count diagnostics and a local read-only equality verifier support future profiling. Details: `docs/museum-source-reader-performance.md`.

## Verification

- `npm run dev:check`: passed
- `npm run prepare:deployment`: passed, including its own fresh Prisma generation and TypeScript check.
- `npm test`: 774 passed, 1 skipped, 0 failed (775 tests total).
- Focused identity/working-view tests: 15 passed; include malformed/non-Saint keys, missing/inactive/unbound records, cross-base duplicates pointing to the same saint, and changed bindings on a fresh invocation.
- Isolated local clone: both alternating-order samples deeply equal across all 1,422 source snapshots; all 1,422 physical rows equal, including identity and source/current revisions, locations, housing and component state. Exactly one verified SPN item remains bound; unreviewed SPN and verified other-museum counterexamples remain excluded. Shared development DB unchanged; isolated clone removed. No production test moves.
- Split timing established synchronous identity processing as the bottleneck: editable identity 2.787–3.399 s → 22–32 ms; working view 3.033–3.315 s → 34–74 ms; original identity projection 3.200–3.333 s → 5–16 ms. Editable query awaits stayed around 201–222 ms.
- `git diff --check`: passed. Integrated build verification belongs to the release captain; this branch changes no dependencies, schema, auth, routes or build configuration.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Do not run the local fixture-seeding script during deployment. It is guarded for a deliberately named isolated local clone only.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: museum domain identity resolver, editable proposal reader, pure working view, working-data reader and move-session source reader. All existing callers default to indexed evaluation; the legacy scan option exists for read-only equivalence profiling.
- Expected conflicts: based on Citra's `4dd411e`, already integrated in captain main `bff9974`. Preserve reviewed-object housing hashing split and newer source-reader changes during integration. Integrate code `ac3269c` and this handoff; do not replay earlier Paramanand commits or the abandoned query-cut experiment.
- Rollback notes: revert `ac3269c` and any dependent release commits
- Skill review: no identity or museum-evidence policy changed; existing skills remain applicable. No skill update required.
- Please notify Nadi directly when deployment succeeds. The separately authorized Paramanand staging correction remains pending until reviewed-object support is live and freshly checked through the native admin UI.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
