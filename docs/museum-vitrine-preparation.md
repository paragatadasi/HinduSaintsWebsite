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
