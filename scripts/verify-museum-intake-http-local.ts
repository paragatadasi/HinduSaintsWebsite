import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

const database = new URL(process.env.DATABASE_URL || "postgresql://invalid/invalid");
const base = new URL(process.env.MUSEUM_INTAKE_TEST_URL || "http://invalid");
const local = (hostname: string) => ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
if (!local(database.hostname) || !database.pathname.startsWith("/museum_intake_test") || !local(base.hostname) || base.protocol !== "http:") {
  throw new Error("Use only an explicitly configured disposable localhost museum_intake_test database and HTTP localhost test server.");
}
if (!process.env.MEDIA_UPLOAD_ROOT || !process.env.MUSEUM_INTAKE_UPLOAD_ROOT || path.resolve(process.env.MUSEUM_INTAKE_UPLOAD_ROOT) !== path.resolve(process.env.MEDIA_UPLOAD_ROOT, "_museum-private")) {
  throw new Error("Use a disposable public upload root with intake storage in its exact _museum-private subtree, matching the test server.");
}
const { db } = await import("../lib/db");
const suffix = randomUUID();
const curator = await db.user.create({ data: { email: `curator-${suffix}@example.invalid`, roles: ["curator"] } });
const denied = await db.user.create({ data: { email: `contributor-${suffix}@example.invalid`, roles: ["contributor"] } });
const curatorToken = randomUUID(), deniedToken = randomUUID();
await db.session.createMany({ data: [{ userId: curator.id, sessionToken: curatorToken, expires: new Date(Date.now() + 600_000) }, { userId: denied.id, sessionToken: deniedToken, expires: new Date(Date.now() + 600_000) }] });
const museum = await db.museum.create({ data: { slug: `http-intake-${suffix}`, name: "Disposable route test" } });
type Entry = { id: string; version: number; media: { id: string; url: string }[]; status: string; deliveries: { status: string }[] };
function request(url: string, token?: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (token) headers.set("Cookie", `authjs.session-token=${token}`);
  if (init.method && init.method !== "GET" && !headers.has("Origin")) headers.set("Origin", base.origin);
  return fetch(new URL(url, base), { ...init, headers, redirect: "manual" });
}
async function jsonMutation(url: string, body: unknown, method = "POST", token = curatorToken) {
  return request(url, token, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
try {
  const api = "/api/admin/museum-intake";
  assert.equal((await request(api)).status, 401);
  assert.equal((await request(api, deniedToken)).status, 403);
  assert.equal((await request(api, curatorToken, { method: "POST", headers: { "Origin": "https://other.invalid", "Content-Type": "application/json" }, body: "{}" })).status, 403);
  const fields = { saintName: "HTTP test saint", relicDescription: "Cloth" };
  const response = await jsonMutation(api, { museumId: museum.id, clientRequestId: randomUUID(), fields });
  assert.equal(response.status, 200, await response.clone().text());
  let entry = await response.json() as Entry;
  const image = await sharp({ create: { width: 40, height: 20, channels: 3, background: "white" } }).png().toBuffer();
  const form = new FormData();
  form.set("file", new File([new Uint8Array(image)], "relic.png", { type: "image/png" }));
  form.set("kind", "relic"); form.set("expectedVersion", String(entry.version));
  const uploaded = await request(`${api}/${entry.id}/media`, curatorToken, { method: "POST", body: form });
  assert.equal(uploaded.status, 200);
  entry = await uploaded.json() as Entry;
  const photo = entry.media[0];
  assert.equal((await request(photo.url)).status, 401);
  assert.equal((await request(photo.url, deniedToken)).status, 403);
  const authenticated = await request(photo.url, curatorToken);
  assert.equal(authenticated.status, 200);
  assert.equal(authenticated.headers.get("Content-Type"), "image/jpeg");
  assert.equal(authenticated.headers.get("Cache-Control"), "private, no-store");
  assert.equal((await sharp(Buffer.from(await authenticated.arrayBuffer())).metadata()).format, "jpeg");
  const privateReference = await db.museumIntakeMedia.findUniqueOrThrow({ where: { id: photo.id } });
  assert.equal("storageKey" in photo, false);
  const publicProbe = await request(`/media/_museum-private/${privateReference.storageKey}`);
  assert.equal(publicProbe.status, 404);
  assert.equal(publicProbe.headers.get("location"), null);
  const stale = await jsonMutation(`${api}/${entry.id}`, { expectedVersion: entry.version - 1, fields }, "PATCH");
  assert.equal(stale.status, 409);
  form.set("kind", "bio_document"); form.set("expectedVersion", String(entry.version));
  const bioUpload = await request(`${api}/${entry.id}/media`, curatorToken, { method: "POST", body: form });
  assert.equal(bioUpload.status, 200); entry = await bioUpload.json() as Entry;
  const submitted = await jsonMutation(`${api}/${entry.id}/submit`, { expectedVersion: entry.version });
  assert.equal(submitted.status, 200); entry = await submitted.json() as Entry;
  const approved = await jsonMutation(`${api}/${entry.id}/review`, { action: "approve", expectedVersion: entry.version, saintDecision: { kind: "new_draft" } });
  assert.equal(approved.status, 200); entry = await approved.json() as Entry;
  assert.equal(entry.status, "approved");
  assert.deepEqual(entry.deliveries.map(d => d.status), ["blocked_configuration", "blocked_configuration"]);
  assert.equal((await jsonMutation(`${api}/${entry.id}/media/${photo.id}`, { expectedVersion: entry.version }, "DELETE")).status, 409);
  console.log("Authenticated intake routes, permission denial, same-origin checks, private image access, stale saves and immutable approval passed.");
} finally {
  await db.session.deleteMany({ where: { userId: { in: [curator.id, denied.id] } } });
  await db.$disconnect();
}
