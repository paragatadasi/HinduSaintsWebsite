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
  assert.equal(normalizeTelemetryValue("client_error", "Error|https://example.com/private?q=secret"), null);
  assert.equal(normalizeTelemetryValue("client_error", "message containing user data"), null);
  assert.equal(
    normalizeTelemetryValue("client_error", "window_error|TypeError|/_next/static/chunks/app.js:12:4|d0d03784"),
    "window_error|TypeError|/_next/static/chunks/app.js:12:4|d0d03784"
  );
});

test("accepts only allowlisted privacy-safe diagnostic categories", () => {
  assert.equal(
    normalizeTelemetryValue("client_opaque_error", "unhandled_rejection|string|cross_origin"),
    "unhandled_rejection|string|cross_origin"
  );
  assert.equal(normalizeTelemetryValue("client_opaque_error", "unhandled_rejection|private value|cross_origin"), null);
  assert.equal(
    normalizeTelemetryValue("client_resource_error", "script|same_origin|/_next/static/chunks/app.js"),
    "script|same_origin|/_next/static/chunks/app.js"
  );
  assert.equal(normalizeTelemetryValue("client_resource_error", "image|cross_origin|https://private.example/a.jpg"), null);
  assert.equal(
    normalizeTelemetryValue("client_error_suppressed", "client_opaque_error|repeat_limit"),
    "client_opaque_error|repeat_limit"
  );
});

test("rejects dimensions on aggregate engagement events", () => {
  assert.equal(normalizeTelemetryValue("saint_gallery_open", undefined), "");
  assert.equal(normalizeTelemetryValue("saint_gallery_open", "unexpected"), null);
});
