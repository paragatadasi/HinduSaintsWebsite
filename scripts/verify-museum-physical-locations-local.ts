import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import pg from "pg";
import type { MoveSnapshot } from "../lib/museum-move-session-domain";

const url = new URL(process.env.DATABASE_URL || "postgresql://invalid/invalid");
if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !url.pathname.startsWith("/museum_physical_test_")) throw new Error("Use a fresh disposable localhost museum_physical_test_ database.");
const sql = new pg.Client({ connectionString: url.href });
await sql.connect();
assert.equal((await sql.query("SELECT COUNT(*)::int AS count FROM information_schema.tables WHERE table_schema='public'")).rows[0].count, 0);
for (const name of (await readdir("prisma/migrations")).filter(name => /^\d/.test(name)).sort()) await sql.query(await readFile(`prisma/migrations/${name}/migration.sql`, "utf8"));
await sql.end();
const { db } = await import("../lib/db");
const api = await import("../lib/museum-physical-locations");
const sessions = await import("../lib/museum-move-session-service");
const curator = { id: "physical-test-curator", canManage: true };
const vitrine = (code: string, shelf = "") => ({ kind: "vitrine" as const, code, label: `Vitrine ${code}`, ...(shelf ? { shelf } : {}) });
const snapshot: MoveSnapshot = { proposalVersion: "test-v1", title: "Independent physical facts", vitrineCodes: ["1", "2", "27", "28"], guidance: { version: "g1", reviewStatus: "review" }, rows: [
  { sourceId: "a", sourceKey: "test:Saints:a", saintId: "same-saint", name: "First separate source", sourceReported: vitrine("1", "A"), destination: vitrine("2"), holdReason: "", fixedHousing: false },
  { sourceId: "b", sourceKey: "test:Saints:b", saintId: "same-saint", name: "Second separate source", sourceReported: vitrine("1", "B"), destination: vitrine("2"), holdReason: "", fixedHousing: false },
  { sourceId: "fixed", saintId: null, name: "Fixed object", sourceReported: vitrine("1"), destination: vitrine("1"), holdReason: "", fixedHousing: true },
  { sourceId: "catalog", saintId: null, itemId: "cverified1234567890123456789", itemIds: [], name: "Verified object", sourceReported: vitrine("1"), destination: vitrine("2"), holdReason: "", fixedHousing: false }
] };
const loader = async () => structuredClone(snapshot);
try {
  await db.externalRecord.createMany({ data: ["a", "b"].map(id => ({ sourceType: "airtable", externalId: `test:Saints:${id}`, entityType: "Saint", entityId: "same-saint", rawPayloadJson: { original: id } })) });
  const externalBefore = await db.externalRecord.findMany({ orderBy: { id: "asc" } });
  const request = async (ids: string[], target = "27") => {
    const view = await api.readMuseumPhysicalLocations(loader, ids);
    return { museumId: "museum-spn", clientRequestId: randomUUID(), confirmedDate: "2026-10-27", datePrecision: "date", evidence: "Curator confirmed the listed source observations; shelf not specified.", physicalConfirmation: true, inventoryAcknowledged: true,
      records: view.rows.map(row => ({ sourceId: row.sourceId, saintId: row.saintId, expectedCurrentRevision: row.currentRevision, expectedSourceRevision: row.sourceRevision, expectedLocationVersion: row.currentVersion, to: vitrine(target) })) };
  };
  const first = await request(["a"]);
  await assert.rejects(api.confirmMuseumPhysicalLocations(first, { ...curator, canManage: false }, loader), /curator/);
  const saved = await api.confirmMuseumPhysicalLocations(first, curator, loader);
  assert.equal(saved.rows[0].current!.code, "27");
  assert.equal(saved.rows[0].current!.shelf, undefined);
  assert.deepEqual(saved.rows[0].original, vitrine("1", "A"));
  assert.deepEqual(saved.rows[0].proposalDestination, vitrine("2"));
  assert.equal((await api.readMuseumPhysicalLocations(loader, ["b"])).rows[0].currentBasis, "source");
  assert.equal(await db.museumMoveSession.count(), 0);
  const receipt = saved.receipt.afterJson as { confirmedDate: string; datePrecision: string; emptyCaseClaim: string; proposalChanged: boolean };
  assert.equal(receipt.confirmedDate, "2026-10-27"); assert.equal(receipt.datePrecision, "date");
  assert.equal(receipt.emptyCaseClaim, "none"); assert.equal(receipt.proposalChanged, false);
  assert.equal((await api.confirmMuseumPhysicalLocations(first, curator, loader)).replayed, true);
  await assert.rejects(api.confirmMuseumPhysicalLocations({ ...first, evidence: "Changed retry" }, curator, loader), /already recorded/);
  await assert.rejects(api.confirmMuseumPhysicalLocations({ ...first, clientRequestId: randomUUID() }, curator, loader), /physical location changed/);
  const batch = await request(["a", "b"], "28"); batch.records[1].expectedLocationVersion = 99;
  await assert.rejects(api.confirmMuseumPhysicalLocations(batch, curator, loader), /physical location changed/);
  assert.equal(await db.museumMoveCurrentLocation.count(), 1);
  await assert.rejects(api.confirmMuseumPhysicalLocations(await request(["fixed"]), curator, loader), /fixed or special/);
  await assert.rejects(api.confirmMuseumPhysicalLocations(await request(["catalog"]), curator, loader), /verified inventory/);
  const staleIdentity = await request(["b"]);
  await db.externalRecord.update({ where: { sourceType_externalId: { sourceType: "airtable", externalId: "test:Saints:b" } }, data: { entityId: "changed-saint" } });
  await assert.rejects(api.confirmMuseumPhysicalLocations(staleIdentity, curator, loader), /identity or its evidence changed/);
  await db.externalRecord.update({ where: { sourceType_externalId: { sourceType: "airtable", externalId: "test:Saints:b" } }, data: { entityId: "same-saint" } });
  const originalBefore = structuredClone(snapshot.rows);
  const create = { museumId: "museum-spn", proposalVersion: snapshot.proposalVersion, clientRequestId: randomUUID() };
  const session = (await sessions.startMuseumMoveSession(create, curator, async () => structuredClone(snapshot))).session;
  await api.confirmMuseumPhysicalLocations(await request(["a", "b"], "28"), curator, loader);
  const afterSession = (await sessions.readMuseumMoveSession("museum-spn", session.id)).session!;
  assert.equal(afterSession.version, session.version);
  assert.equal(afterSession.proposalVersion, "test-v1");
  assert.equal(afterSession.rows.find(row => row.sourceId === "a")!.current!.code, "28");
  assert.equal((afterSession.rows.find(row => row.sourceId === "a")!.sessionStarting as { location: { code: string } }).location.code, "27");
  snapshot.proposalVersion = "test-v2"; snapshot.rows[0].destination = vitrine("1");
  assert.equal((await api.readMuseumPhysicalLocations(loader, ["a"])).rows[0].current!.code, "28");
  assert.deepEqual(snapshot.rows[1], originalBefore[1]);
  assert.deepEqual(await db.externalRecord.findMany({ orderBy: { id: "asc" } }), externalBefore);
  assert.equal(await db.museumArrangement.count(), 0);
  assert.equal(await db.museumItemPlacement.count(), 0);
  assert.equal(await db.saint.count(), 0);
  await db.museumMoveCurrentLocation.create({ data: { museumId: "museum-spn", sourceId: "retained-old-source", location: vitrine("28"), confirmedAt: new Date(), confirmedById: curator.id } });
  assert.equal((await api.readMuseumPhysicalLocations(loader)).unmappedCurrentLocations[0].sourceId, "retained-old-source");
  assert.equal(api.physicalConfirmationInput.safeParse({ ...first, confirmedDate: "2026-02-31" }).success, false);
  assert.equal(api.physicalConfirmationInput.safeParse({ ...first, records: [{ ...first.records[0], to: { kind: "invalid", code: "staging-area", label: "Staging area" } }] }).success, false);
  console.log("PASS: exact-source/date-precision confirmations without sessions; original/proposal preservation; retry receipts; stale atomic/identity rejection; catalog/fixed/role holds; same-saint scope; existing-session history independent of later proposal changes.");
} finally { await db.$disconnect(); }
