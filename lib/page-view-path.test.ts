import assert from "node:assert/strict";
import test from "node:test";
import { normalizePageViewPath, normalizeTelemetryPath } from "./page-view-path";

test("normalizes public page paths without retaining query strings or fragments", () => {
  assert.equal(normalizePageViewPath(" /saints/ramana-maharshi/?q=ignored#section "), "/saints/ramana-maharshi");
  assert.equal(normalizePageViewPath("//traditions///advaita/"), "/traditions/advaita");
  assert.equal(normalizePageViewPath("/"), "/");
});

test("rejects non-page and private paths", () => {
  assert.equal(normalizePageViewPath("saints/ramana-maharshi"), null);
  assert.equal(normalizePageViewPath("/admin/analytics"), null);
  assert.equal(normalizePageViewPath("/api/health"), null);
  assert.equal(normalizePageViewPath("/_next/static/app.js"), null);
});

test("limits telemetry to known public route shapes", () => {
  assert.equal(normalizeTelemetryPath("/map?year=1600"), "/map");
  assert.equal(normalizeTelemetryPath("/places"), "/places");
  assert.equal(normalizeTelemetryPath("/saints/ramana-maharshi"), "/saints/ramana-maharshi");
  assert.equal(normalizeTelemetryPath("/sampradayas/advaita"), "/sampradayas/advaita");
  assert.equal(normalizeTelemetryPath("/places/tiruvannamalai/extra"), null);
  assert.equal(normalizeTelemetryPath("/invented/high-cardinality-path"), null);
});
