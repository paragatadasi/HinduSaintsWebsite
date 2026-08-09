# Saint merge hardening audit

This audit defines the safety boundary for the B5 Saint duplicate merge. It is
an implementation contract as well as a cleanup record.

B5 is deployed in production as of August 9, 2026. The final release uses
`main` revision `9335f57`, `deploy` revision `c4a6115`, production workflow
`31321311391`, and migration `20260811100000_saint_slug_redirects`. Integrated
verification passed 129 tests and the complete 16-page production build and
trace collection.

## Authorization and confirmation

- Duplicate comparison and merge-plan review require `merge_saints`, currently
  granted to Site Admins, Data Admins, and Editors.
- Final execution also requires `manage_sensitive_actions`, currently granted
  only to Site Admins, plus the shared sensitive-action password and an explicit
  acknowledgement.
- Every gate is repeated in the server action. Navigation and disabled or
  omitted controls are not authorization boundaries.
- Only a durable `resolved` Saint `DuplicateCandidate` can be merged. The action
  rechecks the candidate and both Saint records inside a serializable database
  transaction before changing data.

## Relationship transfer inventory

The transaction handles all current Saint-owned or Saint-referencing data:

- aliases, biographies, gallery media, places, and traditions;
- tradition founder and lineage references, including parent-Saint links;
- directional Saint relationships and their source evidence;
- family memberships and private Museum section assignments;
- Instagram matches, applied claims, and Saint-targeted claim references;
- homepage quote and featured-Saint configuration;
- content sources, external records, reconciliation issues, duplicate
  candidates, assignments, and feedback submissions;
- retired slugs and previous redirects from an earlier merge.

Exact relationship duplicates are consolidated without discarding notes or
evidence. Biography slug conflicts remain as separate biographies under a safe
suffix. Relationships between the two merged records are removed because they
would become self-links. Stale editorial drafts, optimistic-edit conflicts, and
presence rows for both records are cleared deliberately.

## Privacy review

- `DuplicateCandidate`, merge evidence, field choices, audit JSON, and transfer
  counts remain admin-only and are never added to a public content contract.
- Museum assignments are transferred in the database but are not serialized by
  public Saint queries.
- A retired public slug resolves only when its surviving Saint has legacy
  `published` status. Private, unpublished, and archived survivors return the
  normal not-found response instead of disclosing a canonical slug.
- Admin retired-slug lookup applies the requester's Full Catalog or Public team
  scope before redirecting.
- The merge cannot publish content implicitly except when the reviewer
  explicitly selects a published value from one of the two confirmed records.
  Publication compatibility still forces Published to remain Public.

## Legacy cleanup notes

The merge does not remove rolling compatibility that is still used elsewhere:

- `Saint.status` remains synchronized with `publicationStatus` because public
  queries and existing deployment code still read the legacy field.
- Legacy `contributor` role compatibility remains until production users and
  stored sessions have fully migrated to `fact_checker`.
- Generic reconciliation `merge` decisions remain follow-up markers; they do
  not invoke this Saint-specific merge action.
- Existing Place and Tradition merge actions still use their earlier
  relationship-transfer implementations and sensitive-action boundary. They
  should adopt retired-slug records and the conflict-review pattern in a future
  scoped hardening phase rather than being changed implicitly by B5.
