import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import pg from "pg";
import sharp from "sharp";

const url = new URL(process.env.DATABASE_URL || "postgresql://invalid/invalid");
if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !url.pathname.startsWith("/museum_intake_test_document_")) {
  throw new Error("Use a fresh disposable localhost museum_intake_test_document_ database.");
}
const migration = "20261027230000_museum_intake_relic_document";
const client = new pg.Client({ connectionString: url.href });
await client.connect();
assert.equal((await client.query("SELECT COUNT(*)::int AS count FROM information_schema.tables WHERE table_schema='public'")).rows[0].count, 0);
for (const name of (await readdir("prisma/migrations")).filter(name => /^\d/.test(name) && name < migration).sort()) {
  await client.query(await readFile(`prisma/migrations/${name}/migration.sql`, "utf8"));
}
process.env.MEDIA_STORAGE_BACKEND = "filesystem";
process.env.MUSEUM_INTAKE_STORAGE_BACKEND = "filesystem";
process.env.MEDIA_UPLOAD_ROOT = await mkdtemp(path.join(tmpdir(), "museum-intake-document-test-"));
const { db } = await import("../lib/db");
const api = await import("../lib/museum-intake-service");
const actor = { id: `document-owner-${randomUUID()}`, roles: ["curator"] as const, canReview: true };
try {
  const museum = await db.museum.create({ data: { slug: `document-${randomUUID()}`, name: "Disposable document test" } });
  const childId = randomUUID();
  let entry = await api.createMuseumIntake({ museumId: museum.id, clientRequestId: randomUUID(), fields: { saintName: "Document regression" }, relics: [{ id: childId, relicDescription: "Cloth" }] }, actor);
  const raw = await sharp({ create: { width: 12, height: 12, channels: 3, background: "white" } }).png().toBuffer();
  const file = new File([new Uint8Array(raw)], "document.png", { type: "image/png" });
  for (const kind of ["relic", "saint_portrait", "bio_document"] as const) {
    entry = await api.addMuseumIntakeMedia(entry.id, entry.version, kind, file, actor, kind === "relic" ? childId : undefined);
  }
  const beforeMedia = await db.museumIntakeMedia.findMany({ where: { intakeId: entry.id }, orderBy: { id: "asc" } });
  const beforeEntry = await db.museumRelicIntake.findUniqueOrThrow({ where: { id: entry.id } });
  await assert.rejects(api.addMuseumIntakeMedia(entry.id, entry.version, "relic_document", file, actor, childId), /MuseumIntakeMedia_kind_check/);
  assert.deepEqual(await db.museumIntakeMedia.findMany({ where: { intakeId: entry.id }, orderBy: { id: "asc" } }), beforeMedia);
  assert.deepEqual(await db.museumRelicIntake.findUniqueOrThrow({ where: { id: entry.id } }), beforeEntry);
  console.log("Reproduced: existing migration chain rejects relic_document while all three earlier kinds succeed.");
  await client.query(await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8"));
  assert.deepEqual(await db.museumIntakeMedia.findMany({ where: { intakeId: entry.id }, orderBy: { id: "asc" } }), beforeMedia);
  entry = await api.addMuseumIntakeMedia(entry.id, entry.version, "relic_document", file, actor, childId);
  const document = entry.media.find(media => media.kind === "relic_document");
  assert.ok(document);
  assert.equal(document.relicId, childId);
  assert.equal(entry.media.length, 4);
  assert.equal((await api.readMuseumIntakeMedia(entry.id, document.id, actor)).kind, "relic_document");
  assert.deepEqual(await db.museumIntakeMedia.findMany({ where: { id: { in: beforeMedia.map(media => media.id) } }, orderBy: { id: "asc" } }), beforeMedia);
  assert.equal((await api.addMuseumIntakeMedia(entry.id, entry.version - 1, "relic_document", file, actor, childId)).version, entry.version);
  entry = await api.submitMuseumIntake(entry.id, { expectedVersion: entry.version }, actor);
  assert.equal(entry.status, "submitted");
  assert.equal(entry.media.length, 4);
  await assert.rejects(client.query(`UPDATE "MuseumIntakeMedia" SET kind='unsupported_kind' WHERE id=$1`, [document.id]), /MuseumIntakeMedia_kind_check/);
  console.log("PASS: additive migration, real child-document upload/read/retry/submit, earlier media and fields preserved, unsupported kinds still rejected.");
} finally {
  await db.$disconnect();
  await client.end();
}
