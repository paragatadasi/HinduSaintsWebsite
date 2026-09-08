import assert from "node:assert/strict";
import test from "node:test";
import { getAuthEmailRateLimitFingerprint, isAuthEmailRateLimited } from "@/lib/auth-email-rate-limit";

test("auth email rate-limit fingerprints normalize addresses", () => {
  const expected = getAuthEmailRateLimitFingerprint("editor@example.com", "secret");

  assert.equal(getAuthEmailRateLimitFingerprint(" Editor@Example.COM ", "secret"), expected);
  assert.notEqual(getAuthEmailRateLimitFingerprint("another@example.com", "secret"), expected);
  assert.notEqual(getAuthEmailRateLimitFingerprint("editor@example.com", "another-secret"), expected);
});

test("auth email rate limiter accepts three requests per address in its window", () => {
  const previousSecret = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = "rate-limit-test-secret";
  const email = `rate-limit-${Date.now()}@example.com`;

  try {
    assert.equal(isAuthEmailRateLimited(email), false);
    assert.equal(isAuthEmailRateLimited(email), false);
    assert.equal(isAuthEmailRateLimited(email), false);
    assert.equal(isAuthEmailRateLimited(email), true);
  } finally {
    if (previousSecret === undefined) {
      delete process.env.AUTH_SECRET;
    } else {
      process.env.AUTH_SECRET = previousSecret;
    }
  }
});
