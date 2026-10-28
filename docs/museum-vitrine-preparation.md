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
