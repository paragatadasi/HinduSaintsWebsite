import assert from "node:assert/strict";
import test from "node:test";
import {
  createSlidingWindowRateLimiter,
  getFeedbackRateLimitFingerprint
} from "./feedback-rate-limit";

test("feedback rate limiter accepts five attempts in a rolling ten-minute window", () => {
  const limiter = createSlidingWindowRateLimiter();
  const now = Date.UTC(2026, 7, 12, 10, 0, 0);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal(limiter.consume("visitor", now + attempt), true);
  }

  assert.equal(limiter.consume("visitor", now + 5), false);
  assert.equal(limiter.consume("another-visitor", now + 5), true);
});

test("feedback rate limiter releases a key when its rolling window expires", () => {
  const limiter = createSlidingWindowRateLimiter({ limit: 1, windowMs: 1_000 });
  const now = Date.UTC(2026, 7, 12, 10, 0, 0);

  assert.equal(limiter.consume("visitor", now), true);
  assert.equal(limiter.consume("visitor", now + 999), false);
  assert.equal(limiter.consume("visitor", now + 1_000), true);

  limiter.prune(now + 2_000);
  assert.equal(limiter.size(), 0);
});

test("feedback fingerprint is secret-keyed and does not expose the raw address", () => {
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.42, 10.0.0.1",
    "x-real-ip": "198.51.100.4"
  });

  const fingerprint = getFeedbackRateLimitFingerprint(headers, "rate-limit-secret");

  assert.equal(fingerprint, "25d6193e6487006efb7815938a34ab58c41f7db25b7f1f28f4252f82d1d160bb");
  assert.equal(fingerprint?.includes("203.0.113.42"), false);
  assert.notEqual(fingerprint, getFeedbackRateLimitFingerprint(headers, "another-secret"));
});

test("feedback fingerprint is disabled without a trusted address or secret", () => {
  assert.equal(getFeedbackRateLimitFingerprint(new Headers(), "secret"), undefined);
  assert.equal(
    getFeedbackRateLimitFingerprint(new Headers({ "x-real-ip": "203.0.113.42" })),
    undefined
  );
});
