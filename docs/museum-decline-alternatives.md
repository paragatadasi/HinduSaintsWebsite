# Alternative destination when declining a guide suggestion

The curator requested optional alternative vitrine/shelf fields on 28 October 2026. These are preferences attached to a declined suggestion. Saving them does not accept a replacement proposal, move a relic, create a task or change physical history.

The existing protected guide-decisions API accepts `alternativeVitrine: string | null` and `alternativeShelf: string | null`. Both are optional for old callers; blank text normalizes to null. Omitting both fields while updating an existing declined decision preserves its preference; explicit null fields clear it. Shelf text remains text (`3.10` is preserved). A shelf requires a vitrine. Non-declined decisions cannot carry either preference. Saving pending/deferred without them clears the stored preference. Notes remain optional and separate.

Server validation restricts alternatives to current layout vitrines with existing/new availability and general housing. Future and special-housing cases are excluded. GET returns `alternativeVitrines` as available codes for consistent UI choices. A preference is not a physical-fit certification.

Current and previous decision readers retain the fields. Exact kind/source-set/original-target inheritance carries alternative metadata with its original provenance and new-version zero revision. Explicit current decisions continue to take precedence. An inherited alternative must still pass current availability validation on any new save.

Existing curator capability, same-origin input handling, immutable guide digest, registered suggestion, version CAS and UUID idempotence checks remain. A matching retry from an older client that omitted both new fields also recognizes the older fingerprint format, avoiding a false conflict across deployment. New audit receipts retain the structured alternative within the decision and explicitly report no physical/proposal change.

Migration `20261028121000_museum_decline_alternatives` adds two nullable columns and a shelf/vitrine/decline consistency constraint to `MuseumGuideSuggestionDecision`; existing rows remain valid with null preferences. Run in the deployment release phase before promoting code, not during the web build. No backfill or environment changes are required. Citra owns dialog and summary presentation; no shared client-type changes are included in this backend branch.
