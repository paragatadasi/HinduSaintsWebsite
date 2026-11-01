import "dotenv/config";
import assert from "node:assert/strict";
import type { Prisma as PrismaTypes } from "../lib/generated/prisma/client";

// Verifies the museum data revision triggers and the revision-keyed snapshot cache against a disposable local
// database with all migrations applied. Writes only AuditEvent rows tagged "museum-revision-verify".
const database = new URL(process.env.DATABASE_URL || "postgresql://invalid/invalid");
if (!["localhost", "127.0.0.1", "[::1]"].includes(database.hostname) || !database.pathname.startsWith("/museum_revision_test")) {
  throw new Error("Use a disposable localhost museum_revision_test database, never the website database.");
}
const { db } = await import("../lib/db");
const { Prisma } = await import("../lib/generated/prisma/client");
const { MUSEUM_SNAPSHOT_TABLES } = await import("../lib/museum-snapshot-tables");
const { cachedByMuseumRevision, clearMuseumSnapshotCache, readMuseumRevision } = await import("../lib/museum-snapshot-cache");

const entityType = "museum-revision-verify";
const audit = (client: PrismaTypes.TransactionClient = db) =>
  client.auditEvent.create({ data: { action: "museum.revision.verify", entityType, entityId: "verify" } });
const repeatable = { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 20000 };
const revision = async () => BigInt(await readMuseumRevision());

try {
  // 1. Every listed table carries both triggers, deferred to commit.
  const triggers = await db.$queryRaw<{ table: string; name: string; deferrable: boolean; deferred: boolean }[]>`
    SELECT c.relname AS table, t.tgname AS name, t.tgdeferrable AS deferrable, t.tginitdeferred AS deferred
      FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
     WHERE t.tgname IN ('museum_revision', 'museum_revision_truncate') AND NOT t.tgisinternal AND t.tgenabled <> 'D'`;
  for (const table of MUSEUM_SNAPSHOT_TABLES) {
    const row = triggers.find(t => t.table === table && t.name === "museum_revision");
    assert.ok(row?.deferrable && row.deferred, `${table} needs the deferred museum_revision trigger`);
    assert.ok(triggers.some(t => t.table === table && t.name === "museum_revision_truncate"), `${table} needs museum_revision_truncate`);
  }

  // 2. One bump per committed transaction, none for a rollback.
  let before = await revision();
  await db.$transaction(async tx => { await audit(tx); await audit(tx); await audit(tx); });
  assert.equal(await revision(), before + 1n, "three writes in one transaction bump once");
  before = await revision();
  await assert.rejects(db.$transaction(async tx => { await audit(tx); throw new Error("rollback"); }));
  assert.equal(await revision(), before, "a rolled-back transaction does not bump");

  // 3. Cache: one build per revision, rebuild after a write, bypass inside a transaction that already wrote.
  clearMuseumSnapshotCache();
  let builds = 0;
  const build = async () => ({ build: ++builds });
  const read = (client: PrismaTypes.TransactionClient = db) => cachedByMuseumRevision("verify", "v", client, build);
  const [a, b] = await Promise.all([read(), read()]);
  assert.equal(builds, 1, "concurrent readers share one build");
  assert.equal(a, b);
  await db.$transaction(tx => read(tx), repeatable);
  assert.equal(builds, 1, "a repeatable-read reader at the same revision hits the cache");
  await audit();
  await read();
  assert.equal(builds, 2, "a committed write forces a rebuild");
  await db.$transaction(async tx => { await audit(tx); await read(tx); await read(tx); }, repeatable);
  assert.equal(builds, 4, "a transaction that wrote never uses or fills the cache");
  clearMuseumSnapshotCache();
  await db.$transaction(async tx => { await read(tx); await read(tx); });
  assert.equal(builds, 6, "read-committed transactions build without storing");
  assert.throws(() => { (a as { build: number }).build = 0; }, "cached results are frozen outside production");
  let failures = 0;
  clearMuseumSnapshotCache();
  await assert.rejects(cachedByMuseumRevision("verify-fail", "v", db, async () => { failures++; throw new Error("boom"); }));
  await assert.rejects(cachedByMuseumRevision("verify-fail", "v", db, async () => { failures++; throw new Error("boom"); }));
  assert.equal(failures, 2, "failures are not cached");

  console.log(`Revision triggers on ${MUSEUM_SNAPSHOT_TABLES.length} tables, once-per-transaction bumps, rollback, single-flight, rebuild-on-write, written-transaction bypass, read-committed no-store, freezing and failure handling passed.`);
} finally {
  await db.auditEvent.deleteMany({ where: { entityType } });
  await db.$disconnect();
}
