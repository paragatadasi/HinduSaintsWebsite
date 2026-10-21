# Automatic museum family reconciliation

## Behavior

SPN and Vrindavan project current published website relationships into unreviewed museum proposals. A saint connected to a unique nearest Primary family in the same section becomes Secondary and joins that family in section lists, inventory tree context, and the planner. Primary anchors retain their tier. This is a private, read-only projection, not an Airtable import, a new saint, a confirmed section assignment, or a physical move.

Supported connections are guru/disciple, partner/husband/wife, incarnation, succession, biological parent/child relationships, explicit family, and lineage. Biological family connections remain labelled as family connections rather than guru arrows. Generic associations, influence, contemporaries and untyped links do not establish membership. Relationships must be published, at least medium confidence, and neither disputed nor merely imported. Published uncategorized evidence is eligible because current reviewed website connections still use that category; this does not independently certify historical claims.

The traversal uses the live tree's bounds: up to five general relationship hops, and succession-only expansion through ten hops. It stops at the nearest layer of Primary anchors. Multiple anchors in one family agree. Equally near competing families or a family in another section are held with provenance rather than chosen automatically. An existing Primary family key is required; no new curatorial family or missing ancestor is invented. Conflicting/duplicate saint placements and unresolved identities remain unchanged.

## Curator and location safeguards

- Published SPN assignments, SPN family-move/membership decisions, explicit detachments, and all Vrindavan curator proposal overrides take precedence. Explicit museum choices remain separate across museums.
- The projection runs after the existing baseline arrangement validation. It preserves Planned and Implemented status, vitrine, shelf, physical confirmation and inventory acknowledgement. It neither puts every family member in the same vitrine nor confirms any physical move.
- The stored arrangement proposal revision remains bound to its original baseline. Effective arrangement/form revisions include reconciliation evidence, so stale forms and whole-family operations still detect membership changes. Underlying identity, section, source coverage, curator version and original family changes retain their existing invalidation behavior.
- Vrindavan inherits the unprojected SPN baseline, then reconciles against its own Primary anchors and curator overrides. This avoids changing saved Vrindavan revision hashes merely because SPN's automatic view changes.
- Source rows, old proposals and canonical relationship records are not rewritten. Applied provenance includes previous tier/family/rationale, exact anchor IDs and supporting relationship IDs. Held cases include a reason in the existing proposal note.
- SPN legacy source-family move controls are unavailable for families whose effective membership changed automatically. They cannot accidentally move only the old exported subset. Current family arrangement controls operate on the actual projected members and retain their locations until a curator explicitly plans a move.

## Verification and release

Regression tests cover the supported relationship kinds, successor/partner chains, cycles, competing and cross-section anchors, curator decisions, SPN source preservation, tree selectors, and both Planned and Implemented destination preservation. Vrindavan tests exercise effective projection through the real working-domain builder and confirm that later inventory or baseline changes still invalidate stale arrangements. No schema migration, environment configuration, backfill or production data write is required. Deployment activates the read-time projection. Standard code rollback restores the previous view without undoing saved destinations or curator decisions.
