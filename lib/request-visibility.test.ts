import assert from "node:assert/strict";
import test from "node:test";
import {
  getRequestVisibilityPolicy,
  hasAdminSessionCookie,
  isPrivateSurfacePath,
  isPublicCachePath,
  PRIVATE_ROBOTS_HEADER
} from "./request-visibility";

test("recognizes Auth.js and legacy session cookies, including chunked cookies", () => {
  assert.equal(hasAdminSessionCookie(["authjs.session-token"]), true);
  assert.equal(hasAdminSessionCookie(["__Secure-authjs.session-token.0"]), true);
  assert.equal(hasAdminSessionCookie(["next-auth.session-token"]), true);
  assert.equal(hasAdminSessionCookie(["unrelated"]), false);
});

test("marks all admin and dedicated preview paths private", () => {
  for (const path of ["/admin", "/admin/users", "/museumadmin/section", "/preview/saint/example", "/api/admin/media"]) {
    assert.equal(isPrivateSurfacePath(path), true);
  }
  assert.equal(isPrivateSurfacePath("/saints/example"), false);
});

test("retains shared caching only for anonymous public documents", () => {
  assert.equal(isPublicCachePath("/"), true);
  assert.equal(isPublicCachePath("/saints/example"), true);
  assert.equal(isPublicCachePath("/saints/random"), false);

  const policy = getRequestVisibilityPolicy({ pathname: "/saints/example", cookieNames: [] });
  assert.match(policy.cacheControl ?? "", /s-maxage=300/);
  assert.equal(policy.robots, undefined);
});

test("authenticated public responses are private and noindex", () => {
  const policy = getRequestVisibilityPolicy({
    pathname: "/saints/example",
    cookieNames: ["__Secure-authjs.session-token"]
  });
  assert.equal(policy.cacheControl, "private, no-store, max-age=0");
  assert.equal(policy.cdnCacheControl, "private, no-store");
  assert.equal(policy.surrogateControl, "no-store");
  assert.equal(policy.robots, PRIVATE_ROBOTS_HEADER);
});

test("anonymous admin responses are still private and noindex", () => {
  const policy = getRequestVisibilityPolicy({ pathname: "/admin", cookieNames: [] });
  assert.equal(policy.cacheControl, "private, no-store, max-age=0");
  assert.equal(policy.robots, PRIVATE_ROBOTS_HEADER);
});
