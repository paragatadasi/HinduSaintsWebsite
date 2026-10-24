# SPN display-tier review

The protected Source Data screen at `/admin/source-data/museum/tier-review`
downloads a current, read-only snapshot for research. It requires museum,
Source Data and full-catalogue access. Its export is private, uncached and
noindexed. No tier, proposal, relationship, identity or physical state is written.

The snapshot uses the same SPN working reader as the museum. It retains baseline
and effective family-derived tiers, groups by canonical website ID, keeps every
conflicting placement and unlinked observation, and lists source bindings,
reviewed decisions, family moves, detachments and stored arrangements. Distinct
canonical IDs with the same name remain distinct; duplicate candidates are
evidence, not automatic merges. Counts describe records or placement rows, not
verified unique historical people. Project-linked records without a working
placement remain explicit coverage gaps; every mirrored source observation is
listed separately with its current binding and selected raw planning fields.
Deity, site and compound observations need
separate classification before applying a human-saint prominence rubric.

The approved review criteria are prominence within a tradition or region for
Primary (including historical figures by their own public prominence);
documented direct personal affiliation for at least Secondary; and a
substantial credible public biography for at least Secondary. Same tradition,
name popularity, text length and copied boilerplate alone do not qualify.
Public biography contents follow the public reader's published saint/biography
status; external biographical evidence still needs cited review. Direct discussion
by Paramahamsa Vishwananda is a separate review lead, not an automatic promotion.

Existing family reconciliation can traverse multiple hops and must not be
labelled direct affiliation. Explicit curator decisions take precedence unless
the authorized review specifically replaces them with evidenced reasoning.
Tertiary means no higher qualifying evidence has been established; it does not
mean low spiritual importance or a small display object.

This checkpoint supplies the audit only. Broad tier-only application must
preserve placement IDs and arrangement bindings: the existing arrangement hash
includes tier, and confirming a source proposal can replace its placement ID.
Keeping stored coordinates without preserving the operational Planned or
Implemented view is insufficient. A subsequent guarded application workflow
must verify before/after scope, stale evidence, explicit overrides and physical
state before writing a supported research batch.

The application checkpoint must retain source placement IDs rather than create
replacement canonical assignments for every tier edit. A museum-scoped audit
override can be projected after baseline arrangement validation and the existing
family projection, so newly reviewed Primary tiers do not silently start an
unlimited affiliation cascade. Any such implementation must also integrate with
the individual editor's displayed tier and stale-form checks, honor later curator
decisions, and avoid leaking SPN-specific overrides into Vrindavan's inherited
baseline. These are acceptance requirements, not implemented mutation behavior
in this read-only export release.
