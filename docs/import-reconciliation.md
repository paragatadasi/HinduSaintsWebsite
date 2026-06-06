# Import and reconciliation

## Airtable

Airtable is an import/reference source. It is not the live website source of truth.

Museum and relic fields must not be mapped to public pages. If they are preserved for debugging, keep them private and never expose them through public APIs.

Recommended flow:

1. Import raw Airtable rows into `ExternalRecord`.
2. Create or update draft website records only when safe.
3. If a human-edited website field conflicts with an imported value, create a reconciliation issue.
4. Do not silently overwrite CMS edits.

## Instagram

Recommended flow:

1. Ingest URL, type, caption text, posted date, thumbnail, and extracted saint names.
2. Normalize extracted names.
3. Compare against saints and aliases.
4. Auto-suggest matches with confidence.
5. Send uncertain items to `/admin/instagram`.
6. Editors can match, create saint, add alias, ignore, or mark needs review.
