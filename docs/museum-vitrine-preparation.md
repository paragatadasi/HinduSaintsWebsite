# Vitrine preparation and shared museum work

Preparation is a durable museum/vitrine acknowledgement, independent of source placements and guide versions. It does not claim that the vitrine is empty, move any contents, or alter a proposal. A previously cleared vitrine remains prepared after placement begins.

Protected physical-locations GET and confirmation/undo responses add `preparations`: `{vitrine, prepared, version, recordedAt, receiptId, basis}`. Historical whole-case clearing receipts project `basis: legacy_clear`, version zero; new updates project `basis: preparation`.

POST the existing physical-locations endpoint with `{action: "preparation.update", museumId: "museum-spn", clientRequestId: UUID, vitrine, prepared: boolean, expectedVersion}`. Missing state starts at version zero. Updates require the existing curator permission and same-origin JSON checks, use the shared movement lock and serializable transaction, check the expected preparation version, and append an audit receipt. Exact UUID retry returns the previous receipt; different content with the same UUID conflicts. The response contains preparations and receipt, without physical rows. No migration or environment change is required.

Whole-case clearing rejects any confirmed occupant, including unmapped current holdings. This prevents a retroactive clear from sending completed placements to staging. Reviewed individual movement remains available. Existing mistaken clearing events are preserved; this change does not repair production data automatically.

Companion-work GET with museumId and no sourceId returns all museum tasks and shelf annotations, including sources outside the active phase, with `scope: museum`. Filtered GET and all work mutations retain source-scoped responses (`scope: sources`). A client must replace the whole collection only for museum scope, and merge mutation responses by sourceId. Current staging already comes from the museum-wide physical-location GET, rather than guide membership.

Intake relics accept optional `additionalSaintsRaw` (maximum 2000 characters), preserved in the existing relic raw JSON and approval snapshot. It is free-text evidence, never an automatic canonical relationship or identity link. Older edit payloads omitting this field preserve the stored value; an explicit empty string clears it. Existing relic IDs and media ownership are unchanged.

## Verification

Focused domain tests cover readiness after placements, revocation, historical clear projection, museum isolation, rejecting confirmed-content clearing, strict request parsing, and intake old-client preservation/explicit clearing. Integrated UI and production-build verification belong to the coordinated Citra release handoff.

## Workflow learning

Preparation completion, empty-case observation, source movement, and checkbox correction are different facts. Store them separately. A later checklist acknowledgement must never replay earlier physical movement. The corresponding local museum-data-interpretation skill should retain this distinction; dated affected source lists belong in private incident evidence.

## Correcting a mistaken whole-case clear

Physical GET exposes server-derived `clearCorrections` with receiptId, vitrine, eligible records and excludedCount. Eligibility requires a trustworthy prior confirmed state in that same cleared vitrine, exact current staging receipt timestamp/version, matching source identity/key/original evidence, and no verified item workflow. Source-only outgoing rows are excluded. Offers are informational; the server rechecks everything under the shared lock.

POST `{action: "clear.correct", museumId: "museum-spn", clientRequestId: UUID, receiptId, records: [{sourceId, saintId, expectedCurrentRevision, expectedSourceRevision, expectedLocationVersion}], mistakenClearAcknowledged: true}` to the physical endpoint. Strip display-only offer fields from each record. All selected records succeed atomically or conflict. The response contains full physical rows, preparations and the batch receipt; reload GET for history and updated offers.

This appends a batch correction plus per-source `check_undone` receipts and restores each exact prior recorded-state envelope, including original effective confirmation timestamp and shelf string. Ledger versions increase; the original clearing receipt stays in audit history. It does not claim a physical return or touch other clearing entries. Existing current-state and history readers understand these envelopes and omit only corrected source events from active movement history. A deployment rollback must retain the restored-state decoder already required by placement undo.

The action requires curator acknowledgement that the selected clearing records were mistaken. A server offer by itself is not authority to apply the correction. Never repair a generic source-only clear or infer physical continuity from old guide membership.

A separate shelf annotation is rebound only if it still matches the exact saint, restored vitrine and immediately preceding physical version. Its text is retained and its annotation version increments with an audit copy. Newer or differently bound annotations remain untouched; reload companion-work after correction.

## A phase with an explicit initial clearing

A registered locked phase may declare `physicalScope: {allowClear: true, clearVitrines: ["37"], destinations}`. This grants no physical-move authorization by itself. The existing protected confirmation endpoint accepts a clear batch only for registered cases, only to generic staging, with `initialCaseClearAcknowledged: true` and fresh CAS for every current occupant, including returnees and sources outside the incoming core roster. Extra sources outside those current cases are rejected. Existing whole-case completeness, source/identity/item, movement-hold and fixed-housing checks still apply.

All placements in that phase, including another destination case, require an actual clearing receipt for each required case. A preparation-only acknowledgement does not satisfy this gate. `phaseClearances` in physical GET/confirmation/undo responses contains `{guideVersion, vitrine, receiptId, recordedAt}` from actual clear receipts. After a first clear, the same phase/case cannot be cleared again; review individual subsequent moves instead. Other phases retain the general confirmed-occupant protection and never gain staging or clearing privileges from this addition.

Incoming sources in cases that have not been explicitly cleared stay at their recorded origins until placement is confirmed. A published phase, an estimate or an outgoing-dependency list must never pre-stage them.

For isolated service verification, `scripts/verify-museum-phase-clearance.ts` requires a disposable PostgreSQL database at exactly `127.0.0.1:55438/museum_test`. Set `MUSEUM_PHASE_TEST_WORKTREE` to a checkout containing the registered Gosaiji/Sai phase and use its tsconfig. The script creates synthetic tables in that empty database; it rejects other hosts/ports/database names. It verifies both-case pre-clear gating, incomplete batch rollback, extra-source rejection, a confirmed returnee, complete 22-entry staging, UUID replay, placement after clearing and repeat-clear rejection. It is never a production repair script.

## Filling an available case before another case clears

A registered phase can narrow its first-clear placement gate with `clearanceRequiredDestinations: ["37", "4"]` and require separate destination readiness with `preparationVitrines: ["75"]`. Omitting the former preserves the original all-destinations gate. With this policy, placing approved75 sources requires the latest museum-wide75 preparation acknowledgement, but does not require or imply clearing37. A batch also targeting37/4 still requires the actual37 clear receipt. Preparation may be revoked; the server rechecks it under the movement lock immediately before writing. Availability/preparation acknowledgement never stages contents or proves emptiness. Incoming origins and user-reported staging evidence remain separate until explicitly reconciled.

## Starter guide v5 curator refinements

The versioned successor retains all136 historical source observations and original physical-confirmation receipts. Harendranath is proposed28 with the exact reciprocal source-recorded Ramdas Babaji Maharaj branch; Srinivasa is proposed2; Dhanamamjari is proposed78 in a curator-labelled Manipur/Assam display outpost. Hemalata remains searchable as a historical observation, with a privately-held movement block in both guide and SPN physical-write guard. These labels do not rewrite canonical identities, historical relationships or website geography.

The v4 reader stays frozen against its v4 Gauridasa-only proposal amendment and remains readable with its original digests. Current v5 decisions inherit only from unchanged exact source/destination scopes. New physical writes from historical guides are rejected after the exact UUID replay lookup, preserving retries of already-recorded confirmations. None of these guide refinements confirms a physical move or replaces the museum current-location ledger. In particular, Harendranath's current confirmed78 remains separate from planned28.
