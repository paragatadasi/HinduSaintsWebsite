-- One counter that moves whenever a table read by the cached museum snapshot changes.
-- lib/museum-snapshot-cache.ts reads it before building, so cached data is never older than its key.
-- Keep this table list identical to MUSEUM_SNAPSHOT_TABLES in lib/museum-snapshot-tables.ts
-- (lib/museum-snapshot-tables.test.ts checks both). A later table needs a new migration with the same two triggers.

CREATE TABLE "MuseumDataRevision" (
  "id"        INTEGER      NOT NULL DEFAULT 1,
  "revision"  BIGINT       NOT NULL DEFAULT 0,
  "lastXid"   XID8,
  "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MuseumDataRevision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MuseumDataRevision_single_row" CHECK ("id" = 1)
);
INSERT INTO "MuseumDataRevision" ("id") VALUES (1);

-- Bumps once per transaction. Deferred to COMMIT, so the counter row is locked only briefly at commit,
-- never for the length of a long import. Rolled-back transactions never bump.
CREATE FUNCTION museum_bump_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE "MuseumDataRevision"
     SET "revision" = "revision" + 1, "lastXid" = pg_current_xact_id(), "changedAt" = CURRENT_TIMESTAMP
   WHERE "id" = 1 AND "lastXid" IS DISTINCT FROM pg_current_xact_id();
  RETURN NULL;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'AirtableMirrorRecord','AuditEvent','ExternalRecord','Museum','MuseumArrangement','MuseumCollectionImport',
    'MuseumDisplayMembership','MuseumExhibitGroup','MuseumFamilyProposalMove','MuseumImportProposal',
    'MuseumItemSaint','MuseumSection','Place','Saint','SaintMuseumSection','SaintPlace',
    'MuseumCollectionItem','MuseumItemPlacement','MuseumLocation','MuseumSaintState','PlaceRelationship',
    'SaintAlias','SaintFamily','SaintFamilyMember','SaintRelationship','SaintTradition','SaintVisitPlace','Tradition'
  ] LOOP
    EXECUTE format('CREATE CONSTRAINT TRIGGER museum_revision AFTER INSERT OR UPDATE OR DELETE ON %I
                    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION museum_bump_revision()', t);
    EXECUTE format('CREATE TRIGGER museum_revision_truncate AFTER TRUNCATE ON %I
                    FOR EACH STATEMENT EXECUTE FUNCTION museum_bump_revision()', t);
  END LOOP;
END $$;
