CREATE TABLE "MuseumGuideSuggestionDecision" (
  "museumId" TEXT NOT NULL, "guideVersion" TEXT NOT NULL, "suggestionId" TEXT NOT NULL,
  "decision" TEXT NOT NULL DEFAULT 'pending', "note" TEXT, "version" INTEGER NOT NULL DEFAULT 1,
  "updatedById" TEXT NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MuseumGuideSuggestionDecision_pkey" PRIMARY KEY ("museumId", "guideVersion", "suggestionId"),
  CONSTRAINT "MuseumGuideSuggestionDecision_decision_check" CHECK ("decision" IN ('pending', 'deferred', 'declined')),
  CONSTRAINT "MuseumGuideSuggestionDecision_version_check" CHECK ("version" > 0)
);
