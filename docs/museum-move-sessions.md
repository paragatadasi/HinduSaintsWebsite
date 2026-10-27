# SPN physical move sessions

Backend foundation, 27 October 2026. This workflow records curator-confirmed physical progress separately from proposals and intake. It tracks source observations individually; repeated saint identities never collapse separate relic observations. It does not invent physical-item IDs or verify inventory completeness.

## State and provenance

A server-registered proposal supplies an immutable session snapshot: source-reported original location/date, destination, named source identity, per-observation fixed-housing flag and pinned guidance version/status. The starting snapshot records resolved locations at session creation. `MuseumMoveCurrentLocation` is a museum/source-scoped, versioned physical ledger independent of the proposal revision; immutable session events preserve before/after values and request IDs. Closing a session or changing a proposal does not rewind that ledger.

Reads resolve current location from the latest direct ledger confirmation or a newer unambiguous exact-source legacy Implemented confirmation; then source-reported origin; then unknown. Planned is never physical state. Legacy events require explicit SPN museum scope. A saint-level event shared by several source rows does not locate each relic unless its checked source IDs explicitly cover them. No saint-only association creates an item link. Existing verified item references are retained only by exact museum/base/table/source key, including multiple links. Those observations are held for the existing catalog item-move workflow rather than writing a competing object placement through the observation ledger. `original`, `sessionStarting`, `currentConfirmed`, `current`, `currentBasis`, `currentVersion` and `currentRevision` remain distinct in the DTO. Later confirmations change current state, never the immutable starting/source/proposal snapshots.

Paragata explicitly confirmed 76/78 empty as new cases on 27 October. The snapshot carries this dated initial-empty evidence for those two cases only. It does not override subsequently recorded occupancy or certify fit. No other case becomes empty merely because it has zero listed rows.

## Minimal staging flow

There is one generic **Staging area**, stable code `staging-area`; no table naming, setup or allocation is required. No staging capacity is inferred. A curator can confirm that already-cleared vitrines had their listed displays moved there, then see each replacement's current Bring-from location. A display that normally stays in a whole-cleared case must also be recorded staged and shown to return.

`clearedVitrines` is an explicit whole-case attestation, not a side effect of moving outgoing displays. Every listed current display in those cases must be in the same staging batch. Fixed/special-housing records are blocked individually, never silently skipped. The event records the curator's clear confirmation at that time while retaining `inventoryCompleteness:unverified`; the application must not infer unlisted objects, physical capacity or a permanent empty state. Outgoing-only/partial batches omit `clearedVitrines` and make no empty claim. Current ledger records omitted by a later proposal remain visible as unmapped locations and prevent a false whole-case clear.

Direct transfers to an occupied vitrine are allowed only as explicitly acknowledged physical moves. They never displace another record automatically or declare the destination empty/fit. Multiple confirmed observations can occupy one vitrine; shelves remain optional. There is no silent physical undo or prototype reset.

## API

Protected base `/api/admin/museum-move-session`. Reads require active museum/catalog access; writes require `manage_museum`, same-origin JSON and server validation. Only SPN is supported in this foundation. The service accepts a typed server loader; the default adapter registers the current checked-in proposal and rejects unknown versions. Never accept proposal/source snapshots from a browser.

- GET `?museumId=museum-spn&sessionId?` returns `{session}` (null if no active session).
- POST `{museumId:'museum-spn',proposalVersion,clientRequestId:UUID}` starts one active session per museum. A retry returns that same session; a new request cannot replace an active one.
- PATCH `{sessionId,expectedSessionVersion,clientRequestId:UUID,action:'move',moves:[{sourceId,expectedLocationVersion,expectedCurrentRevision,to:{kind:'table'|'vitrine',code,label,shelf?}}],clearedVitrines?:string[],physicalConfirmation:true,inventoryAcknowledged:true,note?}` records an atomic batch. Use code `staging-area` for the generic staging area. All source IDs must belong to the pinned snapshot; target vitrines must exist in its registered layout. An empty move list is permitted only for an explicit clear attestation with no listed current contents.
- PATCH `{sessionId,expectedSessionVersion,clientRequestId:UUID,action:'close'}` closes a session only when no tracked displays remain staged.

Each physical action checks session version, per-source ledger version and resolved-current revision in one serializable transaction. Duplicate IDs, stale records and conflicting request-ID reuse fail without partial writes. Identical retries do not create duplicate moves. Events and current ledger are updated together under a museum-scoped advisory lock. A session cannot be replaced/closed with unresolved staging; later proposals cannot orphan that progress.

## Integration and verification

Migration `20261028000000_museum_move_sessions` adds three tables and one partial unique index for active sessions; no existing saints, inventory, intake or arrangements are rewritten. The web build does not apply this migration. No new environment variable or dependency.

The reader adapter uses shared `lib/spn-current-proposal.ts` and its accepted-baseline policy. It follows the approved application v10 without a second hardcoded proposal choice. Before enabling phase1 writes, integrate Saarthi's guidance version and verify its assignment digest. Guidance must re-evaluate current locations and overrides; its old source-ledger simulation is not current physical evidence.

`verify-museum-move-session-local.ts` uses a fresh disposable localhost `museum_move_session_test…` database, applies migrations and exercises persistence, staging, occupied-case moves, fixed objects, idempotency, atomic conflicts, access and proposal/current separation. Focused domain tests cover legacy museum scope, Planned rejection, ambiguous saint-level confirmation and whole-case inclusion of stay-in-place records. Production browser/curator confirmation is an integration checkpoint; this backend foundation is not a ready deployment handoff.


Backend checkpoint: four domain tests, fresh disposable PostgreSQL persistence checks, `dev:check` and final `codex:verify` pass. The verifier also checks that a later exact-source legacy confirmation invalidates a stale action and that verified catalog item links use their existing object-move workflow. Citra owns remaining UI/guidance/browser integration; these backend results alone do not mark the companion ready for release.

Learning review: `museum-data-interpretation` now distinguishes physical history from proposal projections and requires exact source/item scope for legacy confirmations. `museum-planner` now requires whole-case clearing to include returning displays and distinguishes explicit empty observations from missing inventory. Both skills pass the official validator; ambiguous saint-level and partial-clear counterexamples are exercised in the domain tests. Identity reconciliation rules did not change.
