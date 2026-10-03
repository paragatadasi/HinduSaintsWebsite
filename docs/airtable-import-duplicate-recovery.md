# Airtable missing-draft duplicate recovery

The legacy importer checked external linkage first. When a base slug existed,
it created a new saint using the full Airtable-name slug unless that exact full
name was already an alias. It returned before checking display/canonical names.
A missing external link therefore allowed two profiles for the same person.

The importer now skips all slug collisions and checks aliases along with names.
The legacy repair mode also uses this conservative classification, so it cannot
bypass the guard. Distinct people sharing a name need an editorial decision.
This does not solve every spelling/transliteration variant automatically.

## Review and recovery

Open Source Data → Airtable → Review imported saint drafts. All imports is the
default. Choose the affected run to narrow by ExternalRecord.importedAt, then
compare suspected duplicates with the established profiles. Legacy runs did not
persist a list of created IDs; overlapping runs can share timestamp candidates.
The list identifies this importer through preserved rawPayloadJson.importedBy,
and respects saint catalog visibility. Include reviewed and archived imports
to inspect prior imports after their status changes.

Select only confirmed duplicates and Archive. This is reversible through the
existing Saint publication controls and keeps raw source values. It is not a
complete rollback: shared places, traditions, sources and media remain, as do
external links. Reconcile source linkage/merge decisions individually before
future import. Do not use Reset CMS import data to undo one run: it targets all
Airtable-derived CMS records, including earlier saints.

No production records were altered as part of this code fix.

## Planned production recovery

1. Wait for the release captain to confirm successful production deployment.
   Until then, avoid missing-draft imports and legacy slug repairs. Confirm a
   recoverable database backup before any cleanup, and retain import job history.
2. In the production admin, identify the affected run by its start/end time and
   draft count. Record its ID, mode, status, timestamps, and collision summary.
   The development database inspected for this change only contains June history;
   it cannot establish the affected production run or a removal count.
3. Open the imported-drafts list for that run. Treat the timestamp-filtered list
   as candidates, not a deletion manifest. Include reviewed/archived imports to
   check whether any affected drafts have since been edited or published.
4. Prepare a review manifest with duplicate ID/slug, established saint ID/slug,
   Airtable external ID, identity evidence, current status, editorial changes,
   dependencies, proposed action, and reviewer decision. Compare aliases, dates,
   places, biographies and source records; a longer slug or matching name alone
   is insufficient. Check Instagram links, families, relationships, museum
   associations, editorial drafts and revisions before changing anything.
5. Classify each candidate as confirmed duplicate, distinct saint, or uncertain.
   Retain distinct saints and leave uncertain identities pending. If a duplicate
   contains useful human edits or new associations, preserve that material and
   reconcile it with the established saint before archiving. Published or actively
   reviewed records need individual review rather than blanket batch cleanup.
6. Archive a small first batch of confirmed, unpublished duplicates through the
   existing admin controls. Record the previous statuses and archive decisions.
   Verify the established saints and their public pages are unchanged; use
   Include reviewed and archived imports to confirm the archived records remain
   accessible. Restore previous publication states if an identity was mistaken.
7. After checking the first batch, archive the remaining approved candidates in
   manageable batches. Reconcile external linkage to the retained saints through
   the existing reviewed merge/link workflow where available. Do not repoint
   external records automatically: these also carry relationship and museum
   provenance. If the UI cannot safely transfer the linkage, prepare a separate
   reviewed, transactional repair with a backup and explicit affected IDs.
8. Run the import Check action after reconciliation. Confirm that retained and
   archived linked records are skipped and collisions are shown for review.
   Record totals for archived duplicates, retained distinct saints, unresolved
   identities and remaining linkage work. Leave shared taxonomy/media/source
   cleanup for separate review; it is unnecessary for removing duplicate profiles
   from the active queue. Do not delete drafts or run the global CMS reset.

Completion means each candidate has a recorded decision, confirmed duplicates
are archived with recoverable source data, established profiles are unchanged,
and a subsequent check cannot recreate the same reviewed duplicates. This plan
does not authorize or execute production data changes.
