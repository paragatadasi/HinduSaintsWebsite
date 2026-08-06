import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTelemetryValue } from "./telemetry-values";

test("accepts only defined Web Vital buckets", () => {
  assert.equal(normalizeTelemetryValue("web_vital_lcp", "good"), "good");
  assert.equal(normalizeTelemetryValue("web_vital_lcp", "exactly-1234ms"), null);
});

test("accepts only coarse client navigation duration buckets", () => {
  assert.equal(normalizeTelemetryValue("navigation_duration", "poor"), "poor");
  assert.equal(normalizeTelemetryValue("navigation_duration", "837"), null);
});

test("sanitizes client error dimensions without retaining messages", () => {
  assert.equal(
    normalizeTelemetryValue("client_error", "TypeError|/_next/static/chunks/app.js:12:4"),
    "TypeError|/_next/static/chunks/app.js:12:4"
  );
  assert.equal(normalizeTelemetryValue("client_error", "Error|https://example.com/private?q=secret"), "Error|unknown");
  assert.equal(normalizeTelemetryValue("client_error", "message containing user data"), "Error|unknown");
});

test("rejects dimensions on aggregate engagement events", () => {
  assert.equal(normalizeTelemetryValue("saint_gallery_open", undefined), "");
  assert.equal(normalizeTelemetryValue("saint_gallery_open", "unexpected"), null);
});
