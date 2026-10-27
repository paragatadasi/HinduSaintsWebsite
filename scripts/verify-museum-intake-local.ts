import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";

// Run only against a disposable, explicitly named local test database after migrations.
const url = new URL(process.env.DATABASE_URL || "postgresql://invalid/invalid");
if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !url.pathname.startsWith("/museum_intake_test")) {
  throw new Error("Use a disposable localhost museum_intake_test database, never a website or production database.");
}
process.env.MEDIA_STORAGE_BACKEND = "filesystem";
process.env.MEDIA_UPLOAD_ROOT = await mkdtemp(path.join(tmpdir(), "museum-intake-integration-"));
const { db } = await import("../lib/db");
const intake = await import("../lib/museum-intake-service");
const suffix = randomUUID();
const owner = { id: `owner-${suffix}`, roles: ["curator"] as const, canReview: false };
const reviewer = { id: `reviewer-${suffix}`, roles: ["curator"] as const, canReview: true };
const stranger = { ...owner, id: `stranger-${suffix}` };
const fields = { saintName: "Intake test saint", relicDescription: "Cloth", birthDateRaw: "circa 1700?" };
try {
  const museum = await db.museum.create({ data: { slug: `intake-${suffix}`, name: "Disposable intake test" } });
  const saint = await db.saint.create({ data: { slug: `intake-${suffix}`, canonicalName: fields.saintName, displayName: fields.saintName } });
  const create = { museumId: museum.id, clientRequestId: randomUUID(), fields };
  let entry = await intake.createMuseumIntake(create, owner);
  assert.equal((await intake.createMuseumIntake(create, owner)).id, entry.id);
  await assert.rejects(intake.readMuseumIntake(entry.id, stranger), /not found/);
  await assert.rejects(intake.submitMuseumIntake(entry.id, { expectedVersion: entry.version }, owner), /photo/);
  const raw = await sharp({ create: { width: 40, height: 20, channels: 3, background: "white" } }).png().toBuffer();
  const file = new File([new Uint8Array(raw)], "relic.png", { type: "image/png" });
  entry = await intake.addMuseumIntakeMedia(entry.id, entry.version, "relic", file, owner);
  assert.equal((await intake.addMuseumIntakeMedia(entry.id, entry.version - 1, "relic", file, owner)).version, entry.version);
  // Shared biography documents are optional.
  entry = await intake.addMuseumIntakeMedia(entry.id, entry.version, "bio_document", file, owner);
  const expectedVersion = entry.version;
  const saves = await Promise.allSettled([
    intake.editMuseumIntake(entry.id, { expectedVersion, fields: { ...fields, relicDescription: "Cloth A" } }, owner),
    intake.editMuseumIntake(entry.id, { expectedVersion, fields: { ...fields, relicDescription: "Cloth B" } }, owner)
  ]);
  assert.equal(saves.filter(result => result.status === "fulfilled").length, 1);
  entry = await intake.readMuseumIntake(entry.id, owner);
  entry = await intake.submitMuseumIntake(entry.id, { expectedVersion: entry.version }, owner);
  entry = await intake.editMuseumIntake(entry.id, { expectedVersion: entry.version, fields }, owner);
  assert.equal(entry.status, "draft");
  entry = await intake.editMuseumIntake(entry.id, { expectedVersion: entry.version, fields }, reviewer);
  entry = await intake.submitMuseumIntake(entry.id, { expectedVersion: entry.version }, owner);
  const approval = { action: "approve", expectedVersion: entry.version, saintDecision: { kind: "existing", saintId: saint.id } };
  await assert.rejects(intake.reviewMuseumIntake(entry.id, approval, owner), /curator/);
  entry = await intake.reviewMuseumIntake(entry.id, approval, reviewer);
  assert.equal(entry.status, "approved");
  assert.equal(entry.deliverySummary, "configuration_required");
  assert.equal(entry.deliveries.length, 2);
  assert.equal((await intake.reviewMuseumIntake(entry.id, approval, reviewer)).version, entry.version);
  const snapshot = entry.approvedSnapshot;
  entry = await intake.editMuseumIntake(entry.id, { expectedVersion: entry.version, fields }, owner);
  assert.equal(entry.status, "draft");
  assert.deepEqual(entry.approvedSnapshot, snapshot);
  entry = await intake.removeMuseumIntakeMedia(entry.id, entry.media[0].id, { expectedVersion: entry.version }, owner);
  assert.deepEqual(entry.approvedSnapshot, snapshot);
  assert.equal(await db.saint.count({ where: { slug: `intake-${suffix}` } }), 1);
  assert.equal(await db.museumCollectionItem.count({ where: { catalogMuseumId: museum.id } }), 0);
  assert.equal((await db.saint.findUniqueOrThrow({ where: { id: saint.id } })).status, "draft");
  console.log("Intake persistence, concurrency, ownership, curator correction, immutable approval and disabled delivery checks passed.");
  console.log("Disposable database and private temporary photos retained for inspection; dispose of the dedicated test environment afterwards.");
} finally { await db.$disconnect(); }
