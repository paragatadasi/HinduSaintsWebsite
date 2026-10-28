ALTER TABLE "MuseumGuideSuggestionDecision"
  ADD COLUMN "alternativeVitrine" TEXT,
  ADD COLUMN "alternativeShelf" TEXT;
ALTER TABLE "MuseumGuideSuggestionDecision"
  ADD CONSTRAINT "MuseumGuideSuggestionDecision_decline_alternative_check"
  CHECK (("alternativeShelf" IS NULL OR "alternativeVitrine" IS NOT NULL)
    AND (("alternativeVitrine" IS NULL AND "alternativeShelf" IS NULL) OR "decision" = 'declined'));
