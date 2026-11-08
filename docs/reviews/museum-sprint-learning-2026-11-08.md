# Museum sprint learning — 8 November 2026

This retrospective records lessons from curator use and the implementation inspected on codex/review-progress-groups. It is not a production deployment audit.

## What changed our approach

| Observation | Reusable decision | Where it belongs |
| --- | --- | --- |
| Two devices amplified expensive refreshes | Profile aggregate request work; reuse revision-scoped reads and indexed receipt calculations | [Performance](../design/admin-performance.md) |
| Small saves felt as heavy as page loads | Return affected state; separate server acknowledgement from optimistic feedback | Performance guide and concurrency tests |
| Cached results introduced correctness risks | Cover every dependency, isolate mutable results, keep write validation authoritative | Read-performance contract |
| Approved prototypes drifted during implementation | Compare the same populated state and viewport before release | [Design delivery](../design-system/museum-design-delivery.md) |
| Real curators preferred different levels of guidance | Prototype the task with representative data before committing to a workflow | Design delivery |
| Hidden errors looked like broken controls | Put pending, failure and recovery at the attempted action | Design delivery |
| Proposal, placement and final review became confused | Model independent states; shared views consume the same resolved roster | Domain contracts and regression checks |
| Excessive clearing restrictions interrupted work | Validate data integrity; do not recreate removed operational gates without an explicit requirement | Workflow review |

## Evidence and limits

- [Read performance](../museum-companion-read-performance.md) records local query counts, payload reductions and cache boundaries.
- [Save concurrency](../museum-companion-save-concurrency.md) records transaction and retry behavior.
- [Earlier performance review](museum-companion-performance-2026-11-01.md) separates implemented follow-ups from measured and unmeasured work.
- Existing snapshot, physical-progress-client, write-concurrency and progress-summary tests are reusable regression coverage.
- Historical developer replay numbers were local measurements, not production service guarantees.
- No new load test or production measurement was run for this documentation pass.

## Next measurement cycle

Run the documented disposable-database checks after relevant backend changes. For the next integrated release, record authenticated cold/warm load, unchanged refresh, checkbox, shelf and task saves with one and six sessions. Include p50/p95, errors, request/query counts, payload size and server CPU. Record dataset size, revision, machine and commit. Compare against a measured baseline; set numerical budgets from that evidence rather than inventing a target.

Keep live data, current placements and unresolved individual cases out of reusable skills. Update a rule only when evidence changes the decision procedure.

