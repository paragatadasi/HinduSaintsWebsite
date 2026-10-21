# Vrindavan section and destination consistency

A curator section change now previews and saves its destination within the same museum transaction. This covers individual proposal edits, whole-family section moves, and supported identity confirmations that change the museum section. No prior stale plan is silently backfilled by deploying this code.

## Destination policy

Only the current valid saved section area determines the default. One vitrine yields a Planned destination; several yield a flexible allocation within those vitrines; no valid saved area leaves the destination unassigned. Invalid vitrines and areas incompatible with the Sikh Vitrine 11 constraint are never automatic targets. An existing explicit Planned vitrine that is inside the new area's vitrines is retained. Shelf is retained only with that same exact vitrine; changing the vitrine or making it flexible/unassigned clears the old shelf.

Saving a destination never marks a physical move Implemented. Existing confirmation audit events remain the source for lastConfirmed in the move companion. New arrangement audit entries preserve previous stored values, including completed placement evidence. Current arrangement confirmation fields reset for the newly proposed move.

Whole-family moves update only members whose section changes. An individual cannot silently leave a family split between sections; explicit detachment or a compatible new family is required. Source entries shared with other saints cannot acquire incompatible sections or destinations. These cases return an actionable review message rather than moving other people implicitly. None of this infers new identity links or changes physical inventory.

## Preview contract

The protected loadSectionDestinationPreviewAction accepts either saintId or familyKey, plus section and optional groupKey for simultaneous individual membership edits. It returns revision, rows and optional blockedReason. Rows include saintId, name, fromSection, toSection, mode (exact/flexible/unassigned), vitrines, shelf and message.

Individual/family save forms supply destinationRevision when their section changes. The server checks the exact current area/version, proposals, arrangement revisions, inventory snapshot, shared source links and membership before writing. A stale preview fails atomically. Existing proposal/family revision checks still apply. Curator identity-review cases include the same destination effects in their option preview and case revision; their allowed source identity and subsection gates remain unchanged.

The shared transaction helper removes obsolete flexible memberships, writes exact or Proposed arrangements, and binds new flexible membership to the final post-write arrangement revision. Existing same-section tier/family edit behavior is unchanged. UI integration and combined release verification are coordinated with Citra; deployment requires those form changes so destination effects are visible before saving.
Shared source peers require the same complete set of feasible destinations, not merely an overlapping vitrine. Shared Implemented peers require explicit joint review. Target areas with stale flexible memberships block the section save; a deliberately reserved empty area remains usable. Existing explicit exact destinations supersede their old flexible memberships. Legacy Ananta/Bon stale plans remain pending separate reconciliation; deployment performs no hidden backfill.

Verification: 12 destination/working-view domain tests and dev:check passed. Run node scripts/verify-vrindavan-section-destinations.cjs for the actual bundled service entrypoints with an in-memory transactional adapter: individual exact/flexible/unassigned, family, curator confirmation, stale-area revisions, curator DB permission, audit failure rollback and physical-history retention. This is not real PostgreSQL concurrency verification. Citra owns preview UI browser checks and integrated release verification.