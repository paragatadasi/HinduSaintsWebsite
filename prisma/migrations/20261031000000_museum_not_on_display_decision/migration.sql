ALTER TABLE "MuseumGuideSuggestionDecision"
  DROP CONSTRAINT "MuseumGuideSuggestionDecision_decision_check",
  ADD CONSTRAINT "MuseumGuideSuggestionDecision_decision_check"
    CHECK ("decision" IN ('pending', 'deferred', 'declined', 'not_on_display'));
