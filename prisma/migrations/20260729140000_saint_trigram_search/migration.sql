-- PostgreSQL-backed fuzzy candidate lookup for the public saint catalog.
-- The application still performs final weighted ranking so public and admin
-- search share one relevance model.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Saint_displayName_trgm_idx"
ON "Saint"
USING GIN (lower("displayName") gin_trgm_ops);

CREATE INDEX "Saint_canonicalName_trgm_idx"
ON "Saint"
USING GIN (lower("canonicalName") gin_trgm_ops);

CREATE INDEX "SaintAlias_alias_trgm_idx"
ON "SaintAlias"
USING GIN (lower("alias") gin_trgm_ops);

CREATE INDEX "Place_name_trgm_idx"
ON "Place"
USING GIN (lower("name") gin_trgm_ops);

CREATE INDEX "Tradition_name_trgm_idx"
ON "Tradition"
USING GIN (lower("name") gin_trgm_ops);
