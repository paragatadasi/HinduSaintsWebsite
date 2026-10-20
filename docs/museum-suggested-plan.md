# Vrindavan suggested move plan

The planner offers **Suggest a Plan for Me**, followed by a preview and **Load
this plan**. **Clear suggested plan** removes only unchanged suggestions from
the active batch. Earlier plans, later edits, and physical confirmations remain.
No source inventory, canonical identity, family membership, SPN arrangement, or
individual relic location is changed.

## Curatorial basis

The numbered-area proposal is Saarthi's 20 October 2026 connected-traditions
research, adapted around the curator's saved Gaudiya reservation in 17–19.
`data/museum/vrindavan-suggested-plan-research.json` preserves the research,
citations, constraints and source references. The compact runtime guide is
`data/museum/vrindavan-suggested-plan.json`; it also contains Nadi's observed
vitrine counts from the v2 planning baseline, dated 20 October 2026.

The draft pairs Gaudiya 19 with Puri 20 across the left aisle and Andhra 1–2
with Datta 12–11 across the right aisle. Sections retain separate identities
when sharing a vitrine. Temple hall 0 is excluded. Global context uses 13 only
when there are actual eligible records. Existing saved areas always win.

Current display families are provisional operational groupings, not reviewed
genealogies. The generator keeps them together, except known contested members.
Shared source entries and duplicate saint identities are kept together.
Groups spanning sections without a common candidate destination are held for
review. Needs Research / Needs section proposal and explicit context holds
remain unassigned. The Madhu Pandit hold applies only while his proposal still
incorrectly says Gujarat; Nadi's reader correction can resolve that condition.

Specific current primary tradition affiliations, qualified by section and
Saarthi's approved cohort list, provide a small co-location preference. They
never create family memberships, merge sections, or form transitive groups.
Their editorial review status is not promoted by planning.

## Space and upper display

The algorithm balances source-reported frame entries separately from total
entries, including existing exact destinations. It does not multiply quantity
text into frame counts or convert counts into measured capacity. Unknown
packaging participates in cautious frame-load balancing.

The preview compares suggested demand with the dated observed inventory.
Vitrines 18–22 have no observed entries; this is not proof they are empty.
Dense non-frame records in 16–17 cannot establish frame capacity. Sparse
vitrine 23 may have spare space, but the fit is unknown. Nadi's review did not
justify a mandatory area reassignment.

Primary and secondary saints receive an upper-row preference after related
groups are kept together. Five rows is the curator's working assumption, not
a measured capacity. The feature leaves shelf fields blank, allowing actual
positions to be chosen during the move. The companion repeats the upper-row
preference when there is no explicit shelf.

The reviewed baseline initially produced 349 suggestions and 51 holds. With
the additional Madhu context guard it produces 348 / 52 until his correction
is integrated. These are snapshot counts, not hard-coded UI totals; every
preview and application recomputes from current protected museum data.

## Saving and clearing

- Preview is read-only and requires museum/full-catalog access.
- Apply and clear require the existing museum mutation capability.
- The server recomputes assignments; clients submit only revision and guide
  version, never a trusted assignment list.
- A serializable transaction and museum advisory lock protect the batch.
  Revision checks include arrangements, source inventory, saved areas, photo
  setup, and current primary affiliations.
- Existing exact/flexible plans, stale arrangements needing review, and
  historical physical confirmations exclude the entire connected unit.
- Apply writes `Planned`, never `Implemented`, and records created versions in
  a `MuseumSuggestedPlan` audit event.
- Clear checks each version and proposal identity. Edited or implemented
  records are skipped. Suggested areas are emptied only when unchanged and
  no retained planned/implemented destination needs them.
- Clearing is itself audited; history is never erased. A new suggestion can
  then fill remaining eligible gaps.

## Verification

`lib/museum-suggested-plan.test.ts` covers grouping, shared-source protection,
saved areas, held context, temple exclusion, frame counts and affiliation scope.
`scripts/verify-museum-suggested-plan.ts` requires an explicitly named disposable
localhost test database and exercises preview/apply/clear, stale and replay
guards, protection of earlier/edited/implemented plans, and unchanged source
and physical-location records.

The feature reuses the shared planner surface, room schematic, actions and
accessible detail dialog. It introduces no new theme or one-off inline layout.
