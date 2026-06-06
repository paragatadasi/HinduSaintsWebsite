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
