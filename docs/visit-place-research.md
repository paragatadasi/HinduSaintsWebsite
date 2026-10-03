# Visit-place research and catalog corrections

This intermediate phase follows the accepted SPN collection pilot and precedes
Vrindavan. The initial research workbook is `Saints .xlsx`, sheet `saints`,
214 rows. Its 142 populated catalog lists are subsets of live website place
names at the October 2, 2026 audit. Treat them as older context, never a
replacement relationship set. Blank catalog cells do not request removal.

## Checkpoint 1: private research review

Source Data → Visit-place research (`/admin/source-data/visit-places`) loads the
uploaded research JSON derived from the workbook, limited to 750 KB.
The research file is uploaded through the protected admin form and stored in the
website database; it is not bundled in public repository code. Loading requires view_source_data and run_imports.
Review requires view_source_data and edit_structured_content. All routes inherit
protected/noindex admin layout. No public adapter reads VisitPlaceProposal.
The deployment migration creates the empty staging table, not live content.

Original rows, workbook SHA256, sheet/row, and fingerprint remain preserved.
Exact active website slug matches attach existing saints without name matching,
creation, merging, or importing biographies/images/other snapshot fields.
Unmatched identities cannot be approved. Repeating unchanged import is a no-op;
new evidence supersedes pending/deferred observations and opens a fresh review.
Existing approved evidence is retained historically. Latest-observation and
version checks prevent stale decisions; all decisions are audited.

Visit approval marks research ready, never publishes, creates Place/SaintPlace,
changes a canonical saint, or writes Airtable. Record specific verified evidence,
confirm the relationship, and review coordinate precision. Optional approval notes
remain optional; defer/reject/reopen require a reason. Catalog decisions are
separate: unreviewed, keep current associations, or correction review needed with
the proposed association-specific change and evidence.

The workbook's 155 high / 40 medium / 19 low confidence labels are researcher
assessments. 195 entries have no independent source URL. 211 have coordinates,
including approximate locality/region values. Ten entries are outside India.
Pushpa memorials must not be described automatically as burial sites. Broad or
unconfirmed suggestions can remain deferred rather than becoming precise pins.

## Following checkpoints

1. Review representative destinations and catalog follow-ups with the team.
2. Reuse Place graph nodes for approved physical destinations; add a distinct
   SaintVisitPlace relationship supporting many destinations, one preferred,
   association meaning, citations, approval/publication and audit. Shared sites
   use one node. Coordinate confidence/precision and saint connection confidence
   are distinct. Keep private research separate from approved public copy.
3. Add public-safe reviewed visit-place contracts and the shared saint-template
   section. Staged data must never leak through legacy public place queries,
   which currently discover places by a published saint association. Review
   publication eligibility before connecting new nodes into those paths.
4. Apply individually evidenced catalog corrections in versioned transactions,
   preserving historical links not disproved by the new visit recommendation.
   Never globally rename a shared place to correct one saint association.
5. Handle worldwide coordinates in the visit feature; preserve the existing
   India map scope. Approximate points must not offer site-level directions.
6. Pilot, publish approved batches, then return to the Vrindavan audit.

No blanket data replacement, new saint creation, or relic-location change belongs
to this phase. Later source changes propose reconciliation, not silent overwrite.

## Pilot after this release

- A Data Admin or Site Admin opens Source Data → Visit-place research and loads
  the prepared research JSON from the workbook. Expect 214 initial observations; investigate any unmatched slug.
- Reloading the bundle should show unchanged proposals and preserve decisions.
- Inspect Prabhupada's Pushpa Samadhi wording, Neem Karoli Baba's visit proposal
  versus the old Shirdi association, and a low-confidence/unknown destination.
- Confirm at least one supported specific site and one approximate locality;
  leave unsupported destinations deferred. Record catalog follow-ups separately.
- Public saint pages, current catalog places and SPN relic locations should remain
  unchanged throughout this checkpoint.
- The next release consumes approved research through a separate publish action;
  it must never turn all pending research into published place associations.


## Checkpoint 2: explicit acceptance and primary locality

Source Data → Visit-place research now has a confidence filter. After choosing
high, medium or low confidence, use **Review acceptance batch**. The preview
covers the whole filtered batch (up to 300 rows), independently of pagination.
Nothing is preselected: choose individual proposals or Select all eligible,
review the destination/current-primary → proposed-locality comparisons, and
confirm with **Accept selected proposals**. Decision notes are optional.
Individual detail pages offer the same acceptance preview for one proposal.
**Mark research ready** remains a research-only action; **Accepted on website**
is the distinct applied state.

Acceptance requires Source Data access and publication permission. It stores
approved destination name, kind and geography in SaintVisitPlace and exposes
only these facts through the shared public saint template. Published saints get
Places to visit; drafts remain private. Raw research, notes, reviewer identity,
source snapshots and coordinates remain private. No directions or exact-location
pins are generated from unverified workbook coordinates. Confidence labels remain
researcher assessments; the reviewer chooses whether to accept the evidence.
The known Pushpa memorial/burial conflict is blocked until corrected.

Update primary locality is checked by default. The action reuses a unique
compatible locality Place or creates a locality with country/region context.
Ambiguous or archived place identities require review. A new public saint link
cannot expose previously private place editorial content. New locality records
contain only accepted geography. Shared Place names, coordinates and content
are never overwritten. Previous primary associations are demoted to associated;
birth/samadhi/sadhana and other existing links are preserved. The action does not
claim that a memorial destination is the saint's birthplace or residence.

Acceptance is atomic and audited. Preview fingerprints include proposal evidence,
canonical saint/place relationships and matching locality candidates. Stale edits
or a changed source abort the entire selected batch. Replaying the upload does
not reapply accepted data. Later evidence for an already accepted source remains
a separate correction decision rather than silently overwriting website facts.

For tertiary museum proposals only, accepted primary localities update proposed
section geography. Vrindavan/Mathura/Barsana/Govardhan/Radha Kund and other
recognised Braj localities map to **Braj & Krishna Bhakti**. Other documented
locality/state fallbacks are centralized in museum-locality-proposals.ts.
Unknown geography is flagged for section review. Higher tiers, published museum
placements and manually moved families stay unchanged. Proposal lists and the
curator's acceptance action read the same projection; stale pending historical
geography is superseded. Raw exports, curator confirmations and physical relic
locations remain separate. No Airtable writes occur.

Pilot: filter high confidence, preview a small batch, verify locality changes
including Neem Karoli Baba, accept selected entries, then check the saint card,
public Places to visit and the tertiary museum proposal. Keep the Pushpa wording
conflict and uncertain evidence in review. Next work includes independently
reviewed coordinates/directions, association-specific removal of disproved
catalog links, and later accepted-destination corrections. Vrindavan waits until
this SPN/public-data checkpoint has been tested.

The acceptance batch includes a Current location filter: No primary place selects linked saints without a primary SaintPlace association; No place associations selects linked saints without any SaintPlace records. Unresolved saint identities are excluded from these missing-location subsets. This combines with confidence/status/search filters before the 300-proposal preview limit, so Select all eligible operates on the displayed subset. Existing revision checks, duplicate-saint blocks and acceptance confirmation remain in force.
