# Data model

The website database is the source of truth. Airtable and Instagram imports are reference inputs only.

Core entities:

- `Saint`
- `SaintAlias`
- `Sampradaya`
- `Place`
- `SaintRelationship`
- `MediaAsset`
- `InstagramItem`
- `Biography`
- `Source`
- `ImportBatch`
- `ExternalRecord`
- `ReconciliationIssue`
- `AuditEvent`
- `User`

Important rules:

- `Saint.slug` is unique.
- Public pages show only `ContentStatus.published`.
- Instagram items can map to multiple saints through `InstagramItemSaint`.
- Guru/disciple data belongs in `SaintRelationship`, not in one-off text fields.
- Airtable record IDs and raw payloads are preserved in `ExternalRecord`.
- Conflicts become `ReconciliationIssue` records.

## Saint relationship graph

Long-term, saint-to-saint connections should be modeled as a first-class relationship graph, not only as prose inside biographies. Biographies can narrate relationships, but they should not be the only source of truth for them.

`SaintRelationship` should support both typed and untyped connections:

- A typed relationship identifies a known relationship category, such as guru, disciple, initiator, lineage successor, family relation, influence, contemporary, patron, debate opponent, or association.
- An untyped relationship records that two saints are known or believed to be connected, while leaving the exact relationship category uncategorized until an editor can review it.

Relationship records should be able to carry:

- source saint and target saint
- optional relationship type
- directionality, when known
- certainty or evidence status, such as certain, probable, traditional, disputed, imported, or uncategorized
- editorial display rank or weight, for prioritizing which relationships appear first on saint biographies and other public pages
- public description, when appropriate
- internal editorial notes
- citations and source records
- draft, review, and published status
- public/private visibility controls

Display rank should be treated as an editorial presentation field, not as evidence strength. A relationship may be highly important to show on a biography page even when its evidence status is traditional or disputed, and a well-attested relationship may still be low-priority for public display.

Individual biography stories or events should eventually be linkable to saints and to `SaintRelationship` records. This allows a story to serve as narrative context or evidence for a connection without making the story itself the canonical relationship record.

Sampradaya and grouping pages may render curated tree, lineage, timeline, or network views from this graph. The underlying data should allow graph-shaped relationships even when a public page presents a simplified tree.

Imported Airtable, Instagram, CSV, and manual-ingest values may create candidate relationship records or reconciliation issues, but they must not silently overwrite reviewed CMS relationship data.
