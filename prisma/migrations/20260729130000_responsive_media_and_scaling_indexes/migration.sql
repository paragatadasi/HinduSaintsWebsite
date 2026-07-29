-- Responsive image metadata for direct object-storage/CDN delivery.
ALTER TABLE "MediaAsset" ADD COLUMN "variants" JSONB;
ALTER TABLE "InstagramMediaAsset" ADD COLUMN "variants" JSONB;

-- Public catalog and relationship lookup indexes. These match the high-traffic
-- filters used by the public saints, traditions, places, and Instagram loaders.
CREATE INDEX "Saint_status_featured_displayName_idx"
ON "Saint"("status", "featured", "displayName");

CREATE INDEX "Tradition_status_name_idx"
ON "Tradition"("status", "name");

CREATE INDEX "SaintPlace_placeId_placeType_idx"
ON "SaintPlace"("placeId", "placeType");

CREATE INDEX "SaintTradition_traditionId_isPrimary_idx"
ON "SaintTradition"("traditionId", "isPrimary");

CREATE INDEX "InstagramItem_type_postedAt_createdAt_idx"
ON "InstagramItem"("type", "postedAt", "createdAt");

CREATE INDEX "InstagramItemSaint_saintId_matchStatus_idx"
ON "InstagramItemSaint"("saintId", "matchStatus");

CREATE INDEX "ContentSource_entityType_entityId_sortOrder_idx"
ON "ContentSource"("entityType", "entityId", "sortOrder");
