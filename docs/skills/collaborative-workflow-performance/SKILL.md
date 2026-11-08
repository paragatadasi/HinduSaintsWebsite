---
name: collaborative-workflow-performance
description: Diagnose and verify slow authenticated multi-user workflows, including saves, polling, shared read models and concurrent edits. Use for application performance under concurrent use; pair with a rendering skill when browser work is the bottleneck.
---

# Collaborative workflow performance

1. Read project performance guidance and identify the affected action, dataset, roles and concurrent sessions. Preserve authorization and existing state semantics.
2. Trace time before request, server/database work, transfer and rendering. Measure repeated samples and aggregate background traffic. Do not infer authenticated health from a public homepage.
3. Choose the smallest measured intervention:
   - Repeated parsing/scanning: validate once and index; verify output/order equivalence.
   - Rebuilt shared reads: audit all dependencies and revision invalidation before caching; bound memory, deduplicate concurrent builds, isolate mutable values and authorize before reuse.
   - Heavy small writes: return affected state, keep authoritative transaction checks, use scoped locks where independent writes can proceed.
   - Excess polling: use cheap revisions/conditional reads, avoid overlap, pause hidden clients and back off failures.
   - Browser-bound work: profile renders/DOM before memoizing or virtualizing; preserve keyboard/find behavior.
4. Never treat a write timeout as rollback. Preserve its request ID for a retry; distinguish pending, confirmed, conflict and unknown outcomes beside the action. A read cache is not a source of write authority.
5. Verify independent and conflicting concurrent writes, duplicate retries, late responses, remote edits during local input, and bulk actions racing individual edits. Use disposable data, not live production mutations.
6. Report baseline/after p50 and p95, errors, query/request counts, payload, CPU, dataset and environment where measurable. State missing evidence. Do not turn local results into production guarantees.

Counterexamples: a faster spinner does not fix server CPU; a cache keyed only by move events misses independent source edits; a full refresh after each checkbox can erase local input and multiply work. Cache scope may be process-local: verify it rather than promising one build across all servers.

Keep application-specific test commands and dependency manifests in the repository, not this skill.

