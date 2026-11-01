// Tables whose writes move "MuseumDataRevision" (see the museum_data_revision migration).
// The cached museum snapshot (lib/museum-snapshot-cache.ts) is only correct while every table read by the
// snapshot entry points is listed here AND has the trigger. lib/museum-snapshot-tables.test.ts enforces both.
// Adding a table: append it here, add a new migration that attaches the same two triggers, run the test.
export const MUSEUM_SNAPSHOT_TABLES = [
  // read directly by the snapshot code
  "AirtableMirrorRecord", "AuditEvent", "ExternalRecord", "Museum", "MuseumArrangement", "MuseumCollectionImport",
  "MuseumDisplayMembership", "MuseumExhibitGroup", "MuseumFamilyProposalMove", "MuseumImportProposal",
  "MuseumItemSaint", "MuseumSection", "Place", "Saint", "SaintMuseumSection", "SaintPlace",
  // read through include/select relations
  "MuseumCollectionItem", "MuseumItemPlacement", "MuseumLocation", "MuseumSaintState", "PlaceRelationship",
  "SaintAlias", "SaintFamily", "SaintFamilyMember", "SaintRelationship", "SaintTradition", "SaintVisitPlace", "Tradition",
  // operational views included in the same revisioned read-model contract
  "MuseumCompanionShelf", "MuseumCompanionTask", "MuseumGuideSuggestionDecision",
  "MuseumMoveCurrentLocation", "MuseumMoveSession", "MuseumMoveSessionEvent"
] as const;

// Functions whose results are cached by revision. Everything they can reach must read only listed tables.
export const MUSEUM_SNAPSHOT_ENTRY_POINTS = ["lib/museum-working-data.ts", "lib/museum-move-session-source.ts", "lib/museum-companion-read-snapshot.ts"] as const;
