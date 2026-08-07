import assert from "node:assert/strict";
import test from "node:test";
import {
  buildClientErrorDiagnostic,
  buildClientResourceDiagnostic
} from "./telemetry-errors";

const origin = "https://saints.example";

test("creates a stable fingerprint from sanitized first-party frames without retaining messages", () => {
  const error = new TypeError("private form value");
  error.stack = `TypeError: private form value\n    at fn (${origin}/_next/static/chunks/app.js:12:4?secret=value)`;

  assert.deepEqual(buildClientErrorDiagnostic({
    channel: "window_error",
    error,
    origin
  }), {
    name: "client_error",
    value: "window_error|TypeError|/_next/static/chunks/app.js:12:4|d0d03784"
  });
});

test("classifies opaque promise rejections without retaining their values", () => {
  assert.deepEqual(buildClientErrorDiagnostic({
    channel: "unhandled_rejection",
    error: "private rejection contents",
    origin
  }), {
    name: "client_opaque_error",
    value: "unhandled_rejection|string|unavailable"
  });
});

test("classifies cross-origin failures without retaining the external URL", () => {
  const error = new Error("third party failed");
  error.stack = "Error: third party failed\n    at https://tracker.example/private.js?visitor=123:1:1";

  assert.deepEqual(buildClientErrorDiagnostic({
    channel: "window_error",
    error,
    filename: "https://tracker.example/private.js?visitor=123",
    origin
  }), {
    name: "client_opaque_error",
    value: "window_error|error|cross_origin"
  });
});

test("retains only allowlisted first-party script paths for resource failures", () => {
  assert.deepEqual(buildClientResourceDiagnostic({
    origin,
    resourceType: "script",
    sourceUrl: `${origin}/_next/static/chunks/app.js?token=secret`
  }), {
    name: "client_resource_error",
    value: "script|same_origin|/_next/static/chunks/app.js"
  });
  assert.deepEqual(buildClientResourceDiagnostic({
    origin,
    resourceType: "image",
    sourceUrl: "https://media.example/private-name.jpg"
  }), {
    name: "client_resource_error",
    value: "image|cross_origin|unknown"
  });
});
