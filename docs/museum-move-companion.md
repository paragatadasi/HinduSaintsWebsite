# Remaining Eastern displays

The `east2` phase registers only receiving cases 26 and 24: 42 source observations,
including the later reviewed Paramanand arm-support recommendation. Existing Eastern,
Vraj and Northern contexts and their saved receipts remain independently registered.
This phase does not reactivate the superseded Northeast destination 73.

`readEastRemainderGuide` projects current identities, source revisions, arrangements,
curator additions, alternatives and living-status evidence through the guarded shelf
context. Ordinary placement submissions repeat that projection inside the existing
physical-location transaction. Each receiving case needs its own clearance and
preparation; loading the phase records no physical moves.

The operational shelf reader overlays Paramanand onto the immutable 347-source
revision-5 packet, yielding 348 source recommendations across the same 18 cases.
His provisional lower Puri band carries an explicit width/fit warning and unknown
footprint. The fresh housing-evidence digest must still match the exact complete
arm-support review; a matching identity/location fingerprint alone cannot release
the housing hold. Suggested bands never populate actual confirmed shelves.

# Move companion refinement

The Vrindavan move companion separates search/sort from starting-vitrine,
destination-vitrine, region, section and status filters. Filters intersect;
flexible plans match any candidate destination. Last curator-confirmed locations
take precedence over original inventory locations. Entries without a destination
remain discoverable. Implemented arrangements needing review remain in Still to do.

Cards initially show saint, section, region and route. Native expandable details
reveal the existing biography/tree, source relics and physical confirmation form.
No completion or location-write semantics changed. Container details use the
additive source component summary documented in museum-packaging-components.md;
planning summaries retain their original entry-based categories.

Verification: 13 targeted filter and packaging tests; dev:check; actual UI in a
synthetic browser fixture, including a 390px-wide responsive viewport. No production
records were edited during testing. Release captain owns integrated build validation.


## Packaging totals across planning views

The section overview, family cards, selected-saint destination panel, family-tree dialog and vitrine contents reuse the same additive component summary as move-companion entry details. A Small Frame/Box entry contributes one Small frame and one Box while remaining one distinct source inventory entry. Source IDs are deduplicated within each displayed group; relic quantities do not multiply component counts. Frame, Small frame, Box, Bag, Urn and Paduka stay separate. Unknown or conflicting entries are held for review.

Planning aggregates retain the previous entry-category breakdown under **Original inventory-entry categories**. Those mutually exclusive entry counts and the additive component counts describe different things; neither is a measured capacity or verified physical-object total. Individual source labels remain preserved.

## Remaining Vraj receivers

The independent `spn-vraj-remainder-2026-10-30-v1` guide registers the 98 reviewed source observations for 32, 33, 34, 35 and 38 (18, 22, 19, 19 and 20 respectively). Its packet derives from revision 5 of the reviewed Vraj/East shelf recommendations. The existing 79/77 guide and its decisions and digests remain unchanged.

Each receiver requires its own complete current-content clearance and preparation before incoming confirmations. A clearance reads the current physical ledger and includes every then-current occupant, including one intended to return; capturing the guide does not clear a case. Normal confirmations recheck the current shelf context inside the existing transaction and museum lock. A changed source, identity, baseline, living-status conflict or newer destination cannot execute the captured assignment. Valid curator additions and alternatives retain their existing guarded workflows.

Two observations have no canonical saint binding. They remain source-scoped inventory entries and acquire no identity link. Original locations, saved proposed destinations, suggested shelf bands and curator-confirmed physical placements remain distinct. Case 33 retains its unknown footprint; case 35 retains the lower-band comparison warnings. These are fit checks, not certified dimensions or capacity.

Server callers use `readVrajRemainderGuide(currentData, physical, alternatives?)`; the pure `projectVrajRemainderGuide` requires an evaluated shelf context. The backend registry owns physical scope; the companion owns phase and shelf rendering. The rollout performs no database migration, backfill or physical confirmation. Workflow review found no new evidence or identity policy requiring a skill change.
## Not-on-display decision persistence

The `not_on_display` row decision is a guide review state, separate from a
confirmed physical move. Migration `20261031000000_museum_not_on_display_decision`
adds it to the database check constraint already used by the application domain.
It changes no saved decisions, alternative destinations or physical placements.

Run `tsx scripts/verify-museum-guide-decisions-local.ts` with a localhost
development `DATABASE_URL` to verify persistence. The verifier creates and removes
its own empty test database, reproduces the old constraint failure, applies the
migration, and checks save, idempotent retry, readback, reset, stale-version
rejection, preserved history and unrelated alternatives. It rejects remote hosts.

## Source-recorded reunion groups

The Ramashray–Tyagi display group uses the reviewed 31 October 2026 source
biography, which names Ramashray of Chitrakoot as Tyagi's guru. The companion
labels the connection as source-recorded and keeps it separate from the
Nimbarka–Kathia family. It does not write a canonical relationship.

The group appears only when both exact source/canonical pairs remain members of
Vitrine 77 in the effective guide. Later destinations or identity changes prevent
the grouping. Grouping changes neither guide decision versions nor physical
confirmation records, and never implies that a suggested shelf is confirmed.

## Temporary SPN Sikh display execution hold

The curator's 31 October 2026 instruction retains physical cases 64–68 until the
new Sikh room is ready. This overrides earlier preparation flags, even where the
current ledger has no entries. It does not clear cases or change proposals.

`museum-case-execution-holds.ts` supplies the shared case and physical-location
checks. Server workflows reject new clearing, preparation, incoming/outgoing
physical confirmations, final shelf changes, and undo/correction restorations
involving those cases. Legacy sessions and Implemented arrangements, including
family batches, use the same rule. Verified item moves and source reconciliation
cannot bypass it. New mirrored items with a held source location stay pending.

Future Proposed/Planned destinations, item plans/cancellation, research tasks and
historical readbacks remain available. Successful request retries return their
existing receipts. Vrindavan is unaffected. Remove or revise the hold only after
a newer explicit curator decision; do not infer its expiry from an empty list.

`verify-museum-case-execution-holds-local.ts` creates a disposable localhost test
database to verify blocked batches, preparation, legacy sessions, undo, clearing
corrections and legacy implementation. It also checks unrelated moves, retries,
future planning and the Vrindavan exception, then drops its test database.


### Reviewed Gajanan display relationship (31 October 2026)

After live destination projection, the Datta guide may append the Shivpuri/Akkalkot Gajanan source to Gangadhara's existing family in Vitrine 3. Both exact source/canonical bindings, visible membership and destination 3 must match; a changed destination or identity suppresses the display relationship. The institutional biography supports the label “Initiation / succession” (11 March 1938). This is a display projection, not a canonical relationship write. It preserves existing family ancestors, physical history, tiers and shelf values; origin remains live. Gajanan of Shegaon is a distinct record. The evidence artifact is `spn-shivpuri-western-evidence-2026-10-31-v1.json` in Saarthi's dated outputs. Kamaal is outside this change.


### Kamaal provisional locality display (31 October 2026)

For the exact reviewed Kamaal source/canonical binding, the proposal viewer uses “Possible Khed Shivapur / Pune · identity review” instead of the imported locality labels. Linked-place selection excludes this observation because the Nepal normalization is unsupported and no source-specific replacement coordinates were reviewed. Other observations can still legitimately retain the same map point. This is display-only; raw geography, identity, physical placement, proposal destination and shelf stay unchanged. No family edge or ready phase for Vitrine 62 is created. See Saarthi's dated Shivpuri Western evidence artifact and Nadi's `western-both-saved-readback.json` for the approved proposal and provisional identity context.

### Vitrine 1 approved BAPS and geographic groups (31 October 2026)

`spn-west-v1-guide-v1.json` captures only the approved Western v9 Vitrine 1 subset: four BAPS records, eight Gondal observations and seven Amreli observations. Eighteen are linked; the possible overlapping Keshavpuri source remains unlinked. Possible Keshavpuri and Jivandas/Jivan Das overlaps retain separate source records and review notes, without a canonical merge or a claim of additional objects. The eight Jalaram–Bhoja/Rajkot/Virpur destinations remain in 60. Brahma Kumaris remain pending an exact receiving case in the main Western area. This phase does not update either cohort.

`readWestV1Guide` validates exact source revisions and canonical bindings against current physical and reviewed proposal data, respecting later curator destinations and pending review. The physical-write transaction repeats this check under the existing addition, decision and arrangement locks. Separately validated curator additions and alternatives use their existing workflows; assistants cannot invoke those exceptions. The unlinked Gondal observation's exact approved guide scope does not alter the global proposal or canonical identity; it remains curator-only while the shared assistant reviewer gate still sees destination 62.

Vitrine 1 requires an availability acknowledgement, with no whole-case clearing or empty-case claim. Shelf guidance is explicitly recommendations only: BAPS occupy shelves 1–2, living Mahant Swami shelf 2, Gondal and Amreli geographic groups below. No personal BAPS lineage is implied for those geographic groups. Ordinary guide confirmations record the vitrine without writing an exact shelf; an explicit shelf uses the separate shelf workflow. Current locations and confirmation basis come from the live physical ledger, not the captured draft.

The known comparison load is 4.966667 / 5 based on source-observation shelf shares, including possible overlaps. It is not measured or certified fit. This release records no physical moves, shelf assignments, canonical relationships or tier corrections. The workflow learning review found no new reusable skill rules; the existing interpretation and planning skills already cover uncertain observations, geographic grouping, living-status constraints and live placement precedence.
