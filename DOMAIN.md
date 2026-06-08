# Hindu Saints Archive

A devotional, source-backed archive of Hindu saints and traditions. The domain balances public spiritual content, editorial review, and ongoing external references without allowing external sources to become the public source of truth.

## Language

**Saint Profile**: The website's canonical editorial record for a saint.
_Avoid_: Airtable saint, Instagram saint

**External Source**: A non-website source that can inform archive content but is not authoritative for public website content.
_Avoid_: source of truth, live CMS

**External Mirror**: A preserved copy of external source data kept for review, debugging, and change detection.
_Avoid_: imported content, CMS content

**Reviewed Content**: Website content that a human editor has accepted for publication or continued editorial ownership.
_Avoid_: imported value, synced field

**Reconciliation Issue**: A review task created when external source data conflicts with reviewed website content or cannot be matched safely.
_Avoid_: import error, automatic update

**Candidate Update**: A proposed change derived from an external source that requires review before affecting reviewed content.
_Avoid_: overwrite, sync

## Relationships

- A **Saint Profile** may be informed by many **External Sources**.
- An **External Source** produces **External Mirror** records.
- An **External Mirror** may create new draft **Saint Profiles**, **Candidate Updates**, or **Reconciliation Issues**.
- **Reviewed Content** belongs to the website and must not be overwritten directly by an **External Source**.
- A **Reconciliation Issue** is resolved by a human editor before it changes **Reviewed Content**.

## Example Dialogue

> **Dev:** "Airtable changed the birth date for this saint. Should the importer update the page?"
> **Domain expert:** "Only if that field is still unreviewed. If the saint profile has reviewed content there, create a reconciliation issue instead."

## Flagged Ambiguities

- "Import" can mean either mirroring raw external data or writing website content. Resolved: use **External Mirror** for preserved source data and **Candidate Update** for proposed website changes.
- "Airtable saint" can refer to either an external row or a website profile created from it. Resolved: use **External Source** or **External Mirror** for Airtable data, and **Saint Profile** for website content.
