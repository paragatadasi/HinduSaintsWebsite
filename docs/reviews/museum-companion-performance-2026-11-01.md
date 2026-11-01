# Museum companion architecture review — 1 November 2026

Scope: source inspection using `emil-performance`, against the Citra feature branch through ef97693. PR #3 and Nadi's policy/backend branch are being integrated separately. This is not a production profile and does not establish the incident's sole cause or a measured speedup.

## Priorities

1. **Finish the incident fix already in flight.** The old 10-second progress GET calls receiver availability reconstruction inside its transaction, then computes an ETag after that work. PR #3 removes this reconstruction and checks a cheaper revision first. Preserve client state when the lightweight response omits availability. Verify authenticated changed and unchanged requests with multiple clients; homepage and health checks do not exercise this path. Evidence: `lib/museum-physical-progress.ts`, `lib/museum-receiver-availability.ts`, `lib/museum-physical-locations-http.ts`.

2. **Reduce independent full-context polling.** `useMuseumShelfPlans` requests the complete shelf endpoint every 30 seconds and on focus. That endpoint loads museum data and full physical locations before deriving planning context. Search separately fetches the whole catalog every 60 seconds and on focus; physical state has its own full refresh. Removing one expensive poll does not remove these other workloads. Prefer shared revision/invalidation state, scoped shelf reads for the selected vitrine, and request deduplication. Keep a lightweight global search index and authoritative checks on writes. Changes to curator proposals, identity bindings and component locations must invalidate the right data. Evidence: `components/admin/use-museum-shelf-plans.ts`, `app/api/admin/museum-shelf-plans/route.ts`, `components/admin/museum-companion-search.tsx`.

3. **Make initial rendering independent of every guide.** The move page awaits full physical and museum data, alternatives, and a batch of guide builders before returning the companion with all phase guides. One slow dependency delays the selected vitrine. Return the room/navigation summary and selected guide first, then load other guides on demand with shared cached reads. Do not lose museum-wide search, cross-phase destination ownership, or persistent selection. Measure server response and payload size before choosing a streaming or endpoint implementation. Evidence: `app/museumadmin/move/page.tsx`.

4. **Reduce unnecessary React work after measuring it.** The companion maps the whole physical row list to shelf annotations, repeatedly searches rows for cards, and derives vitrine membership during renders. Shelf rendering repeats row/edge lookups. Index rows and annotations once per snapshot and separate stable room/guide presentation from frequently changing placement state. Profile before introducing memoization broadly. TreeLines reads layout and updates paths; inspect resize/render frequency rather than treating static edge drawing as an animation bug. Evidence: `components/admin/spn-room-move-companion.tsx`, `components/admin/use-museum-display-work.ts`, `components/admin/museum-active-shelf-guide.tsx`, `components/admin/museum-shelf-guide.tsx`.

5. **Defer hidden detail, preserving usability.** Closed HTML disclosures can still mount family/city trees and checklist controls. Inspect DOM counts and React durations on a large vitrine and staging list. Mount expensive detail on first expansion where appropriate; use pagination or virtualization only when measured scale justifies it. Preserve checkbox state, keyboard focus, browser find expectations and accessible order. Search already limits initial results to 30, so replacing it with a virtualization dependency is not the first priority.

## Existing strengths to preserve

- Independent record writes, immediate pending feedback, scoped response reconciliation and idempotent retries.
- Version checks prevent stale concurrent writes from overwriting newer saves.
- Hidden-tab polling checks and in-flight guards on physical progress and shelf polling.
- Selected phase/vitrine encoded in the URL.
- Shared styles and modest animation; no `transition: all` found in the inspected shared stylesheet.
- The pending manual-refresh patch bounds the physical/decision/work reads and releases loading after a timeout. It does not treat write timeout as proof of failure.

## Validation for the next implementation

Capture authenticated initial load, unchanged poll, changed poll, one checkbox, shelf save, and task save. Record response time, query count, payload size and browser render duration with one user and several simultaneous users. Report median and slow-tail timing from repeated samples, not a single request. Repeat on a large vitrine and a large staging list.

Exercise same-record conflicts, independent-record saves, partial/bulk clearing concurrent with placement, and retry after an uncertain write. For read optimizations, verify a remote user's change reaches another client's visible checklist and does not reset local pending edits. Check that out-of-phase destinations and component-only locations remain correct.

First follow-up after PR #3 should be the shelf/catalog refresh architecture, then initial loading. Rendering improvements follow measured browser evidence. Avoid broad component rewrites during the incident release.


## Consolidated PR #3 fast follow

Client branch: `codex/companion-performance-followup`, based on integrated `main` 88cedab. Bundle with Nadi's `codex/museum-read-performance`; the selected-vitrine contract must ship together.

Implemented:
- Page-scoped shelf/catalog read cache: simultaneous consumers share one request, conditional requests retain unchanged payloads, successful mutations invalidate cached reads. An in-flight response superseded by a write is retried for every subscriber. Read timeout is 20 seconds; cached values expire after 10 seconds. No writes use this cache.
- Shelf panels request `?vitrine=CODE`; the shelf browser receives `availableVitrines` without transferring every case's allocations.
- The server awaits only the requested guide after common inputs load. Remaining guide promises stream into the mounted companion, using those same inputs. Background failure leaves the selected guide usable. This does not eliminate initial museum/physical reads or all background guide work.
- Row and saved-shelf indexes replace repeated linear scans in checklist, search and shelf rendering. No broad virtualization or tree-layout rewrite is included without browser profiling evidence.

Local verification evidence:
- Four cache tests cover request deduplication, expiry, ETag/304, invalidation during concurrent reads, retry and page isolation. Two concurrent consumers issue one request rather than two.
- Existing three receipt tests retain independent-user placement/shelf/task merges and reject older placement receipts.
- Headless Chrome: two shelf readers share one scoped request; switching from 2 to 76 ignores the late response for 2.
- Headless Chrome: the selected-guide streaming wrapper renders before remaining guides resolve and retains its mounted editor and unsaved text when they arrive. The editor is a test probe; this is not an authenticated end-to-end production measurement.
- Headless Chrome: actual search component can still add and confirm a holding without preparation gating.

Server query counts, scoped payload sizes and database concurrency evidence belong to the matching backend handoff. Production save/initial-render latency remains to be measured after deployment; these local checks do not establish a production speedup.
