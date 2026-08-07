import assert from "node:assert/strict";
import test from "node:test";
import {
  getSiteEnvironment,
  isStagingEnvironment,
  shouldBlockSearchIndexing
} from "./deployment-environment";

test("normalizes supported site environments", () => {
  assert.equal(getSiteEnvironment(" production "), "production");
  assert.equal(getSiteEnvironment("STAGING"), "staging");
  assert.equal(getSiteEnvironment("test"), "test");
});

test("uses development for missing or unknown values", () => {
  assert.equal(getSiteEnvironment(undefined), "development");
  assert.equal(getSiteEnvironment("preview"), "development");
});

test("identifies only the staging environment", () => {
  assert.equal(isStagingEnvironment("staging"), true);
  assert.equal(isStagingEnvironment("production"), false);
  assert.equal(isStagingEnvironment(undefined), false);
});

test("blocks indexing for either the staging environment or staging hostname", () => {
  assert.equal(shouldBlockSearchIndexing("hindusaints.org", "staging"), true);
  assert.equal(
    shouldBlockSearchIndexing("staging.hindusaints.org", "production"),
    true
  );
  assert.equal(shouldBlockSearchIndexing("hindusaints.org", "production"), false);
});
