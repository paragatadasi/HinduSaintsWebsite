# Museum data integration

The museum workspace reads canonical CMS saints and private database assignments.
Airtable remains an import/reference source. Museum `published` assignments mean
accepted curatorial decisions, never public website content.

## Data and review

- `SaintMuseumSection` stores section, alternatives, tier, confidence, rationale,
  notes, and source provenance. One accepted primary per saint is enforced by a
  PostgreSQL partial unique index. Unreviewed legacy conflicts stay in the queue.
- `MuseumExhibitGroup` stores private curatorial groups and optional anchor saints,
  independently of historical `SaintFamily` membership and saint relationships.
- `MuseumSaintState.version` protects the entire placement set from stale saves.
  Mutations lock the saint and write assignments plus audit events atomically.
- `MuseumImportProposal` preserves museum-only source snapshots and their decision
  history. Repeated imports are idempotent; a source reversion creates a new event.
  Changes never overwrite accepted placements automatically. Conflicts create
  `ReconciliationIssue` records without copying private museum fields into the
  general reconciliation message. Museum review resolves the corresponding issue.
- A cleared source placement is a review signal, not an instruction to erase data.
- Saint merges preserve original assignment snapshots in audit history, transfer
  Airtable source links and anchor references, invalidate stale forms, and flag
  affected placements for curator review.

## Rollout

1. Apply `20260930090000_museum_integration` in the normal deployment migration
   phase. The web build does not access a database or run migrations. Existing
   accepted-primary conflicts are snapshotted in audit history and changed to
   `needs_review`; no saint, assignment, or source records are deleted.
2. Run `npm run museum:audit` against the intended database. It is read-only and
   reports source candidates, unresolved export IDs, missing primary placements,
   and competing primary assignments. Do not substitute fixture coverage for a
   production audit.
3. In `/museumadmin/review`, choose **Prepare source proposals**. This reads the
   existing Airtable mirror. It does not call Airtable, import missing saints, or
   accept decisions. Mirror museum fields take precedence over legacy CSV exports.
   A mirror without museum fields or earlier museum history may predate planning,
   so it can fall back to an explicitly labeled historical export proposal. Export
   rows without an unambiguous full source mapping remain in the unresolved list.
4. Resolve missing saints and identities through the existing Airtable import and
   saint reconciliation workflows, then prepare proposals again.
5. Review each saint at `/museumadmin/saints/[id]`: compare the current decision,
   source proposal, main saint record, and latest mirror. Accept the proposal,
   retain the current decision, or edit the placement explicitly.

The existing Airtable cleanup job now stages museum proposals instead of directly
creating assignments. Its historical `museumSectionAssignmentsCreated` and
`museumSectionAssignmentsExisting` summary keys remain compatible; new UI copy
calls these museum proposals.

The checked-in proposal export contains 1,399 distinct record IDs across 23
sections. These are historical source rows, not a current production coverage
claim. Database-linked saints are shown in the section browser; unmapped rows,
missing placements, and competing primary placements remain discoverable in the
review queue. Static family trees are labeled historical references on saint
review pages and do not purport to show the current relationship graph.

## Source links and permissions

Museum reads require `access_museum`; saves and proposal staging/review require
`manage_museum`. Curators receive only selected museum/source context here,
without general Source Data access. All pages remain authenticated and noindexed.
No museum model or raw source payload is added to a public page contract.

Airtable mirror refresh attempts the optional base-schema metadata read and stores
its table ID in the preserved payload. This enables valid base/table/record links.
Tokens without schema-read access continue to import records; older mirrors show
an honest base link and record ID until metadata is available. No new environment
variables are required. Reference: https://support.airtable.com/articles/4688931572-finding-airtable-ids

## Verification

- `npm run dev:check`
- `npm test`
- `npm run codex:verify` (required for this migration/route change)
- Apply all migrations to a disposable local database named
  `museum_integration_test`, set `MUSEUM_TEST_DATABASE_URL`, and run
  `npm run test:museum:integration`. The script refuses nonlocal hosts or another
  database name. It creates fixtures; use a fresh disposable database for each run.

The integration suite exercises persisted placements and anchors, optimistic
conflicts, repeat imports and source reversions, retained human edits, proposal
acceptance, rollback, section moves, primary uniqueness, cleared source values,
legacy identity mapping, and a full saint merge. A PGlite socket server can run
these scenarios when Docker is unavailable; it does not replace a production
coverage audit or a real PostgreSQL concurrent-session stress test.

Browser verification also covers save/reload, retaining form input after a stale
save, accepting a source proposal, mobile overflow, review search, authentication,
role restrictions, noindex, and exclusion of private museum notes from public
saint HTML. Two shared layout fixes discovered during these checks correct invalid
footer nesting (which interrupted hydration) and contain the header search label
within its scrolling mobile navigation.
