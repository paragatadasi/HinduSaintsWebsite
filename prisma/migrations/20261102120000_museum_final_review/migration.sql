CREATE TABLE "MuseumFinalReviewState" (
 "museumId" TEXT NOT NULL, "sourceId" TEXT NOT NULL, "saintId" TEXT, "sourceRevision" TEXT NOT NULL,
 "version" INTEGER NOT NULL DEFAULT 1, "planVersion" INTEGER NOT NULL DEFAULT 0,
 "vitrine" TEXT, "shelf" TEXT, "plannedAt" TIMESTAMP(3),
 "decision" TEXT NOT NULL DEFAULT 'pending', "decisionNote" TEXT, "decisionAt" TIMESTAMP(3),
 "flagKind" TEXT, "flagNote" TEXT, "flagStatus" TEXT,
 "updatedAt" TIMESTAMP(3) NOT NULL, "updatedById" TEXT NOT NULL,
 PRIMARY KEY ("museumId","sourceId"),
 CHECK ("version">0 AND "planVersion">=0),
 CHECK ("decision" IN ('pending','declined','not_on_display','deferred')),
 CHECK ("flagKind" IS NULL OR "flagKind" IN ('missing','other')),
 CHECK ("flagStatus" IS NULL OR "flagStatus" IN ('open','resolved'))
);
CREATE INDEX "MuseumFinalReviewState_museumId_flagStatus_updatedAt_idx" ON "MuseumFinalReviewState"("museumId","flagStatus","updatedAt");
CREATE TABLE "MuseumFinalReviewRevision" ("museumId" TEXT PRIMARY KEY,"revision" BIGINT NOT NULL DEFAULT 0);
CREATE TABLE "MuseumFinalReviewReceipt" (
 "museumId" TEXT NOT NULL,"clientRequestId" TEXT NOT NULL,"sourceId" TEXT NOT NULL,
 "fingerprint" TEXT NOT NULL,"revision" BIGINT NOT NULL,"transactionId" BIGINT NOT NULL,"inventoryRevisionBumped" BOOLEAN NOT NULL DEFAULT false,"result" JSONB NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"createdById" TEXT NOT NULL,
 PRIMARY KEY("museumId","clientRequestId")
);
CREATE INDEX "MuseumFinalReviewReceipt_museumId_revision_idx" ON "MuseumFinalReviewReceipt"("museumId","revision");
CREATE INDEX "MuseumFinalReviewReceipt_museumId_inventoryRevisionBumped_transactionId_idx" ON "MuseumFinalReviewReceipt"("museumId","inventoryRevisionBumped","transactionId");
-- Review refreshes also remain correct for maintenance SQL. Receipt gaps force
-- a full review-state refresh rather than silently skipping an external edit.
CREATE FUNCTION museum_bump_final_review_revision() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target text;
BEGIN
 IF TG_OP='TRUNCATE' THEN
  UPDATE "MuseumFinalReviewRevision" SET "revision"="revision"+1;
  RETURN NULL;
 END IF;
 target=CASE WHEN TG_OP='DELETE' THEN OLD."museumId" ELSE NEW."museumId" END;
 INSERT INTO "MuseumFinalReviewRevision"("museumId","revision") VALUES(target,1)
 ON CONFLICT("museumId") DO UPDATE SET "revision"="MuseumFinalReviewRevision"."revision"+1;
 IF TG_OP='UPDATE' AND OLD."museumId" IS DISTINCT FROM NEW."museumId" THEN
  INSERT INTO "MuseumFinalReviewRevision"("museumId","revision") VALUES(OLD."museumId",1)
  ON CONFLICT("museumId") DO UPDATE SET "revision"="MuseumFinalReviewRevision"."revision"+1;
 END IF;
 RETURN NULL;
END $$;
CREATE TRIGGER museum_final_review_revision AFTER INSERT OR UPDATE OR DELETE ON "MuseumFinalReviewState"
 FOR EACH ROW EXECUTE FUNCTION museum_bump_final_review_revision();
CREATE TRIGGER museum_final_review_revision_truncate AFTER TRUNCATE ON "MuseumFinalReviewState"
 FOR EACH STATEMENT EXECUTE FUNCTION museum_bump_final_review_revision();
-- Only planning/decision fields feed the heavy snapshot. Flag-only writes use the
-- separate indexed review revision and receipts, so they do not rebuild inventory.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['MuseumFinalReviewState'] LOOP
  EXECUTE format('CREATE CONSTRAINT TRIGGER museum_revision_insert AFTER INSERT ON %I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW WHEN (NEW."planVersion">0 OR NEW."decision"<>''pending'') EXECUTE FUNCTION museum_bump_revision()',t);
  EXECUTE format('CREATE CONSTRAINT TRIGGER museum_revision_update AFTER UPDATE ON %I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW WHEN (OLD."planVersion" IS DISTINCT FROM NEW."planVersion" OR OLD."decision" IS DISTINCT FROM NEW."decision" OR OLD."decisionAt" IS DISTINCT FROM NEW."decisionAt" OR OLD."museumId" IS DISTINCT FROM NEW."museumId" OR OLD."sourceId" IS DISTINCT FROM NEW."sourceId" OR OLD."saintId" IS DISTINCT FROM NEW."saintId" OR OLD."sourceRevision" IS DISTINCT FROM NEW."sourceRevision" OR OLD."vitrine" IS DISTINCT FROM NEW."vitrine" OR OLD."shelf" IS DISTINCT FROM NEW."shelf" OR OLD."plannedAt" IS DISTINCT FROM NEW."plannedAt" OR OLD."decisionNote" IS DISTINCT FROM NEW."decisionNote") EXECUTE FUNCTION museum_bump_revision()',t);
  EXECUTE format('CREATE CONSTRAINT TRIGGER museum_revision_delete AFTER DELETE ON %I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW WHEN (OLD."planVersion">0 OR OLD."decision"<>''pending'') EXECUTE FUNCTION museum_bump_revision()',t);
  EXECUTE format('CREATE TRIGGER museum_revision_truncate AFTER TRUNCATE ON %I FOR EACH STATEMENT EXECUTE FUNCTION museum_bump_revision()',t);
 END LOOP;
END $$;
