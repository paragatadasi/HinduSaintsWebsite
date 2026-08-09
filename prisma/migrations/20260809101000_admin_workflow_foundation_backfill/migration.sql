UPDATE "Saint"
SET
  "teamVisibility" = CASE WHEN "status" = 'published' THEN 'public'::"TeamVisibility" ELSE 'private'::"TeamVisibility" END,
  "publicationStatus" = CASE
    WHEN "status" = 'published' THEN 'published'::"PublicationStatus"
    WHEN "status" = 'archived' THEN 'archived'::"PublicationStatus"
    ELSE 'unpublished'::"PublicationStatus"
  END,
  "workflowStatus" = 'needs_review'::"WorkflowStatus";

UPDATE "Tradition"
SET
  "teamVisibility" = CASE WHEN "status" = 'archived' THEN 'private'::"TeamVisibility" ELSE 'public'::"TeamVisibility" END,
  "publicationStatus" = CASE
    WHEN "status" = 'published' THEN 'published'::"PublicationStatus"
    WHEN "status" = 'archived' THEN 'archived'::"PublicationStatus"
    ELSE 'unpublished'::"PublicationStatus"
  END,
  "workflowStatus" = 'needs_review'::"WorkflowStatus";

UPDATE "Place"
SET
  "teamVisibility" = 'public'::"TeamVisibility",
  "publicationStatus" = 'published'::"PublicationStatus",
  "workflowStatus" = 'needs_review'::"WorkflowStatus";
