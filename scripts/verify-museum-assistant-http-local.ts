import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

const database = new URL(process.env.DATABASE_URL || "postgresql://invalid/invalid");
const base = new URL(process.env.MUSEUM_INTAKE_TEST_URL || "http://invalid");
const local = (host: string) => ["localhost", "127.0.0.1", "[::1]"].includes(host);
if (!local(database.hostname) || !database.pathname.startsWith("/museum_intake_test") || !local(base.hostname) || base.protocol !== "http:") {
  throw new Error("Use a disposable localhost museum_intake_test database and localhost HTTP server.");
}
const { db } = await import("../lib/db");
const suffix = randomUUID();
const admin = await db.user.create({ data: { email: `admin-${suffix}@example.invalid`, roles: ["site_admin"] } });
const adminToken = randomUUID();
await db.session.create({ data: { userId: admin.id, sessionToken: adminToken, expires: new Date(Date.now() + 600_000) } });
const museum = await db.museum.create({ data: { slug: `assistant-${suffix}`, name: "Disposable assistant test" } });
if (!await db.museum.findUnique({ where: { slug: "spn" } })) {
  await db.museum.create({ data: { id: "museum-spn", slug: "spn", name: "SPN test museum" } });
}
const ids = [admin.id];
const password = `Test-only-${randomUUID()}`;
function request(url: string, token?: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (token) headers.set("Cookie", `authjs.session-token=${token}`);
  if (init.method && init.method !== "GET" && !headers.has("Origin")) headers.set("Origin", base.origin);
  return fetch(new URL(url, base), { ...init, headers, redirect: "manual" });
}
function post(url: string, body: unknown, token?: string) {
  return request(url, token, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
async function login(username: string, value = password) {
  const response = await post("/api/auth/local-sign-in", { username, password: value });
  assert.equal(response.status, 200, await response.clone().text());
  const cookie = response.headers.get("set-cookie") || "";
  assert.match(cookie, /HttpOnly/i); assert.match(cookie, /SameSite=lax/i);
  const token = /authjs.session-token=([^;]+)/.exec(cookie)?.[1];
  assert.ok(token);
  return token;
}
try {
  const username = `assistant-${suffix}`;
  const created = await post("/api/admin/local-accounts", { username, password, name: "Test Assistant" }, adminToken);
  assert.equal(created.status, 200, await created.clone().text());
  const account = await created.json() as { userId: string; username: string };
  ids.push(account.userId);
  const saved = await db.user.findUniqueOrThrow({ where: { id: account.userId }, include: { passwordCredential: true } });
  assert.equal(saved.email, null); assert.deepEqual(saved.roles, ["museum_assistant"]);
  assert.notEqual(saved.passwordCredential?.passwordHash, password);
  assert.equal((await post("/api/admin/local-accounts", { username: username.toUpperCase(), password }, adminToken)).status, 409);
  const token = await login(username.toUpperCase());
  assert.equal((await post("/api/admin/local-accounts", { username: "forbidden", password }, token)).status, 403);
  assert.equal((await request("/api/admin/museum/updates", token)).status, 403);
  assert.equal((await post("/api/admin/museum/updates", {}, token)).status, 403);
  const main = await request("/admin/users", token);
  assert.ok([303, 307].includes(main.status));
  assert.match(main.headers.get("location") || "", /museumadmin\/overview/);
  for (const route of ["/museumadmin/overview", "/museumadmin/plan", "/museumadmin/intake", "/vrindavanadmin/sections"]) {
    const response = await request(route, token);
    assert.equal(response.status, 200, `${route}: ${response.status}`);
  }
  const api = "/api/admin/museum-intake";
  const fields = { saintName: "Assistant test saint", relicDescription: "Cloth" };
  const response = await post(api, { museumId: museum.id, clientRequestId: randomUUID(), fields }, token);
  assert.equal(response.status, 200, await response.clone().text());
  let entry = await response.json() as { id: string; version: number; media: { url: string }[] };
  const image = await sharp({ create: { width: 20, height: 20, channels: 3, background: "white" } }).png().toBuffer();
  const form = new FormData();
  form.set("file", new File([new Uint8Array(image)], "relic.png", { type: "image/png" }));
  form.set("kind", "relic"); form.set("expectedVersion", String(entry.version));
  const upload = await request(`${api}/${entry.id}/media`, token, { method: "POST", body: form });
  assert.equal(upload.status, 200); entry = await upload.json() as typeof entry;
  assert.equal((await request(entry.media[0].url, token)).status, 200);
  const other = await post(api, { museumId: museum.id, clientRequestId: randomUUID(), fields }, adminToken);
  const otherEntry = await other.json() as typeof entry;
  assert.equal((await request(`${api}/${otherEntry.id}`, token)).status, 404);
  const submit = await post(`${api}/${entry.id}/submit`, { expectedVersion: entry.version }, token);
  assert.equal(submit.status, 200); entry = await submit.json() as typeof entry;
  assert.equal((await post(`${api}/${entry.id}/review`, { action: "approve", expectedVersion: entry.version, saintDecision: { kind: "new_draft" } }, token)).status, 403);
  const replacement = `Reset-only-${randomUUID()}`;
  assert.equal((await post(`/api/admin/local-accounts/${account.userId}/password`, { password: replacement }, adminToken)).status, 200);
  assert.equal((await request(api, token)).status, 401);
  assert.equal((await post("/api/auth/local-sign-in", { username, password })).status, 401);
  const logoutToken = await login(username, replacement);
  const csrfResponse = await request("/api/auth/csrf", logoutToken);
  const csrf = await csrfResponse.json() as { csrfToken: string };
  const csrfCookie = csrfResponse.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
  const signOut = await request("/api/auth/signout", undefined, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: `authjs.session-token=${logoutToken}; ${csrfCookie}` }, body: new URLSearchParams({ csrfToken: csrf.csrfToken, callbackUrl: base.origin }) });
  assert.ok([200, 302, 303].includes(signOut.status));
  assert.equal(await db.session.findUnique({ where: { sessionToken: logoutToken } }), null);
  const resetToken = await login(username, replacement);
  await db.user.update({ where: { id: account.userId }, data: { active: false } });
  assert.equal((await request(api, resetToken)).status, 401);
  assert.equal((await post("/api/auth/local-sign-in", { username, password: replacement })).status, 401);
  const foreign = await request("/api/auth/local-sign-in", undefined, { method: "POST", headers: { Origin: "https://other.invalid", "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
  assert.equal(foreign.status, 403);
  console.log("Assistant account creation, email-less login, museum browsing, own intake/photo/submission, denied review/admin access, reset revocation and deactivation passed.");
} finally {
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  await db.user.updateMany({ where: { id: { in: ids } }, data: { active: false } });
  await db.$disconnect();
}
