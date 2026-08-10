import assert from "node:assert/strict";
import test from "node:test";
import {
  applyPlaceNarrativePreview,
  applySaintNarrativePreview,
  applyTraditionNarrativePreview,
  toPreviewSources
} from "./editorial-revision-preview";
import type { PublicPlaceDetail, PublicSaintDetail, PublicTraditionDetail } from "./public-contracts";

test("saint preview overlays narrative and citation snapshots without mutating the live model", () => {
  const live = { shortDescription: "Live", biography: { title: "Live life", bodyMarkdown: "Live body" }, sources: [], furtherReading: [], seo: {} } as unknown as PublicSaintDetail;
  const preview = applySaintNarrativePreview(live, {
    shortDescription: "Pending",
    biographyTitle: "Pending life",
    biographyMarkdown: "Pending body [1](#source-ref-book)",
    sources: [{ citationKey: "book", title: "A Book", sourceType: "book", publicationYear: 2024 }]
  });

  assert.equal(live.shortDescription, "Live");
  assert.equal(preview.shortDescription, "Pending");
  assert.equal(preview.biography?.bodyMarkdown, "Pending body [1](#source-ref-book)");
  assert.deepEqual(preview.sources[0], { id: "book", title: "A Book", sourceType: "book", publicationYear: "2024", author: undefined, publisher: undefined, url: undefined, note: undefined });
});

test("tradition and place previews replace only revision-owned narrative fields", () => {
  const tradition = { name: "Tradition", shortDescription: "Live", overviewFacts: { focus: "Focus" }, sources: [], furtherReading: [] } as unknown as PublicTraditionDetail;
  const traditionPreview = applyTraditionNarrativePreview(tradition, {
    shortDescription: "Pending",
    historyMarkdown: "Pending history",
    sources: []
  });
  assert.equal(traditionPreview.shortDescription, "Pending");
  assert.equal(traditionPreview.historyMarkdown, "Pending history");
  assert.equal(traditionPreview.overviewFacts.focus, "Focus");

  const place = { name: "Place", overviewMarkdown: "Live", saints: [] } as unknown as PublicPlaceDetail;
  const placePreview = applyPlaceNarrativePreview(place, { overviewMarkdown: "Pending" });
  assert.equal(place.overviewMarkdown, "Live");
  assert.equal(placePreview.overviewMarkdown, "Pending");
});

test("preview sources prefer citation keys and retain stable fallbacks", () => {
  assert.deepEqual(toPreviewSources([
    { citationKey: "citation", sourceId: "source-id", title: "First", sourceType: "book" },
    { sourceId: "source-id-2", title: "Second", sourceType: "website" },
    { title: "Third", sourceType: "other" }
  ]).map((source) => source.id), ["citation", "source-id-2", "preview-source-3"]);
});
