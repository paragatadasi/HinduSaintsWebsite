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

## Independent physical confirmations — 27 October 2026

The protected `/api/admin/museum-physical-locations` endpoint records completed placements without starting, closing or retargeting a planning session. It uses the same museum/source current-location ledger and lock as move sessions. This separates the dated physical facts from an organic proposal that may change during a curator visit.

`GET ?museumId=museum-spn` returns all registered source rows. Repeat `sourceId` query parameters for a subset. Each row provides `sourceId`, `sourceKey`, `saintId`, `original`, `proposalDestination`, `proposalVersion`, `current`, `currentBasis`, `currentConfirmed`, `currentVersion`, `currentRevision` and `sourceRevision`. A `currentBasis` of `source` means source-reported fallback, not a confirmed current placement. Current records no longer present in the registered source snapshot remain visible under `unmappedCurrentLocations`. Recent confirmation receipts are returned in `confirmationHistory`; older receipts remain in the audit store.

`POST` accepts `{museumId:"museum-spn",clientRequestId:UUID,confirmedDate:"YYYY-MM-DD",datePrecision:"date",evidence,physicalConfirmation:true,inventoryAcknowledged:true,records:[{sourceId,saintId,expectedCurrentRevision,expectedSourceRevision,expectedLocationVersion,to:{kind:"vitrine",code,label,shelf?}}]}`. Up to 200 distinct sources can be confirmed atomically. Use fresh GET values; canonical/source-link changes, stale locations, fixed housing and verified catalog-item links are held for their respective review/workflows. Future layout spaces are excluded. A curator must explicitly confirm physical facts; catalog readers have read access only. Writes require the authenticated same-origin JSON request.

The returned immutable receipt has an ID, request fingerprint, exact source keys, original/previous/confirmed locations, source versions, actor and recording time. `confirmedDate` has date precision and is kept separately from `recordedAt`; an unknown shelf is omitted rather than copied from the original location. Repeating the exact request returns its receipt without writing again; reusing its UUID with different data conflicts. No source fields, proposals, saints, inventory objects or planning sessions are changed. A confirmation of selected contents makes no empty-case or completeness claim.

For the 27 October visit, the user explicitly confirmed 22 checked entries in two screenshots: 17 in Vitrine 27 and 5 in Vitrine 28. The dated private evidence packet and independent source-ID/original-location audit are held outside the repository. Unchecked entries are not moves. Only records whose original location was in the starter row may be staged; this does not establish that every such record was cleared. Outside that row, unconfirmed source locations remain source-reported fallbacks unless newer physical evidence exists.

Run `scripts/verify-museum-physical-locations-local.ts` only on a fresh disposable localhost `museum_physical_test_…` database. It checks date precision, original/proposal preservation, exact-source separation for one saint's multiple observations, idempotent receipts, atomic stale and identity rejection, role/fixed/catalog holds, retained unmapped current records, and compatibility with an existing pinned session and a later proposal revision. These checks do not themselves confirm production moves.

Learning review for independent confirmations: updated the museum-data-interpretation skill to bind explicit completed-checklist reports to exact source rows and preserve observation-date precision and unknown current shelves. Screenshot-only ticks, unchecked entries and source shelves remain counterexamples. The fresh-database checks cover unknown shelf retention and date-only receipts; museum-planner and saint-identity-reconciliation needed no new rule.

## Starter guide decisions and clearing — 27 October 2026

The starter flow uses one physical ledger, without requiring a planning session: clear vitrines, place key saints/families, then consider city groups. `lib/spn-starter-guide-registry.ts` registers the approved v7 rotation and Saarthi's v2 guide separately from the deployed v10 default. The physical walk is 2,78,36,29,76,28,27. The guide has 136 rows partitioned into non-overlapping family/city phases. The later 21-transfer refinement is review-only and excluded. Existing sessions and global proposal defaults are not retargeted.

The registry verifies the full assignment digest, the original research content digest and a normalized runtime content digest. It adds stable, target-specific IDs to alternative city cohorts; those IDs record a curator's review of a possible choice, not a new target recommendation. Import this registry server-side. Client views should receive normalized display fields and hide local research file paths. `rows.completed` and the 23 reported placements are evidence for a visible review/save step, not proof of a database confirmation. Only successful writes and readback establish saved progress.

### Suggestion decisions

`GET /api/admin/museum-guide-decisions?museumId=museum-spn&guideVersion=…` returns `{museumId,guideContext:{guideVersion,contentDigest,assignmentDigest},suggestions,decisions}`. `decisions` includes persisted entries only; a missing entry is pending at version 0. Suggestion IDs are the guide's family/city group IDs, `row:<sourceId>` for pilot rows, and the registry's `cityAlternatives[].suggestionIdsByTarget[case]` for alternative cohorts.

`POST` accepts `{museumId:"museum-spn",guideVersion,contentDigest,assignmentDigest,suggestionId,expectedVersion,clientRequestId:UUID,decision:"pending"|"deferred"|"declined",note?}` and returns `{decision,receipt,replayed}`. Restore uses `pending`; it is not an undo of a physical move. Decisions are scoped to museum, immutable guide version and suggestion ID, with optimistic versions and immutable audit receipts. Exact retries are idempotent; stale reviews, altered request reuse and unknown suggestions conflict. A group decision is not a historical relationship and does not change any member's location, original evidence, proposal or tier. New guide versions do not silently inherit old decisions.

Migration `20261028010000_museum_guide_suggestion_decisions` adds one table. Existing move/session tables are unchanged. Guide decisions require curator capability, authenticated same-origin JSON and full catalog access; catalog readers may read them. No environment or dependency changes.

### Physical clear actions and alternative choices

The existing physical-location POST now also accepts optional `guideContext:{guideVersion,contentDigest,assignmentDigest}` and `clearedVitrines:string[]`. `records[].to` may be a normal vitrine or `{kind:"table",code:"staging-area",label:"Staging area"}`. Other staging codes are rejected. Whole-case clearing must stage every listed current holding, including returning displays and unmapped current records. A partial staging batch makes no empty-case claim. An explicit empty-case confirmation may send no records with `clearedVitrines`; no empty state is inferred from missing inventory alone.

Receipts distinguish `clearedVitrines` and the time-scoped `emptyCaseClaim:"curator_confirmed_at_event_time"` from the default `none`; completeness remains unverified. Original locations, proposals, suggestion decisions and existing sessions remain unchanged. Import/review reported completed placements before relying on current locations for the next clear. The user's original-row staging clarification describes the starting evidence, not an automatic staging command or a permanent prohibition on later explicit clearing.

A validated guide context is provenance, not a target restriction: a curator can explicitly confirm an alternative city's actual placement in a selected valid vitrine, including sources outside the 136-row pilot. This records a physical fact without endorsing that target as a new proposal. Fixed housing, verified catalog items, source identity and current-version guards still apply. The standalone physical reader's `proposalDestination` is the registered global context; the UI must use the selected guide's targets rather than treating v10 as the current pilot guide.

Living status and tier are independent. The SPN rule relayed by Paragata is that living saints cannot be at the tops of vitrines. Display the concise tags `Living` and `May be alive`; missing death dates do not establish death. Older inventory notes are not current verification. This flow leaves shelf positions unspecified unless separately reported.

`verify-museum-guide-actions-local.ts` exercises migrated-database defer/decline/restore, request retries, stale/digest checks, physical independence, clearing that includes returning displays, valid staging, empty-case acknowledgements, and a deliberate alternative target. Registry tests protect the approved guide, physical walk and exclusion of unaccepted transfers. The independent physical and session verifiers remain regression gates. No test records production moves.
