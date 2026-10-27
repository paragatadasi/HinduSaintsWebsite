import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import pg from "pg";
import type { MoveSnapshot } from "../lib/museum-move-session-domain";
import type { GuideDefinition } from "../lib/spn-starter-guide-registry";
const url = new URL(process.env.DATABASE_URL || "postgresql://invalid/invalid");
if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !url.pathname.startsWith("/museum_guide_test_")) throw new Error("Use a fresh disposable localhost museum_guide_test_ database.");
const sql = new pg.Client({ connectionString: url.href }); await sql.connect();
assert.equal((await sql.query("SELECT COUNT(*)::int AS count FROM information_schema.tables WHERE table_schema='public'")).rows[0].count, 0);
for (const name of (await readdir("prisma/migrations")).filter(name => /^\d/.test(name)).sort()) await sql.query(await readFile(`prisma/migrations/${name}/migration.sql`, "utf8"));
await sql.end();
const { db } = await import("../lib/db");
const decisions = await import("../lib/museum-guide-decisions");
const physical = await import("../lib/museum-physical-locations");
const { starterGuideContext } = await import("../lib/spn-starter-guide-registry");
const actor = { id: "guide-test-curator", canManage: true };
const guide: GuideDefinition = { context: { guideVersion: "fixture-v1", contentDigest: "a".repeat(64), assignmentDigest: "b".repeat(64) }, suggestions: [{ id: "family-a", kind: "family", sourceIds: ["a", "b"], targetVitrine: "27" }] };
const guideLoader = (version: string) => ({ ...guide, context: { ...guide.context, guideVersion: version } });
const vitrine = (code: string, shelf = "") => ({ kind: "vitrine" as const, code, label: `Vitrine ${code}`, ...(shelf ? { shelf } : {}) });
const snapshot: MoveSnapshot = { proposalVersion: "fixture-proposal", title: "Guide fixture", vitrineCodes: ["2", "3", "5", "27", "28"], guidance: { version: "g", reviewStatus: "review" }, rows: [
  { sourceId: "a", sourceKey: "test:Saints:a", saintId: "same-saint", name: "A", sourceReported: vitrine("2", "A"), destination: vitrine("27"), holdReason: "", fixedHousing: false },
  { sourceId: "b", sourceKey: "test:Saints:b", saintId: "same-saint", name: "B returning here", sourceReported: vitrine("2", "B"), destination: vitrine("2"), holdReason: "", fixedHousing: false }
] };
const loader = async () => structuredClone(snapshot);
try {
  await db.externalRecord.createMany({ data: ["a", "b"].map(id => ({ sourceType: "airtable", externalId: `test:Saints:${id}`, entityType: "Saint", entityId: "same-saint", rawPayloadJson: {} })) });
  const before = structuredClone(snapshot);
  const input = { museumId: "museum-spn", ...guide.context, suggestionId: "family-a", expectedVersion: 0, clientRequestId: randomUUID(), decision: "deferred", note: "Check space later" };
  assert.equal((await decisions.readMuseumGuideDecisions("fixture-v1", guideLoader)).decisions.length, 0);
  await assert.rejects(decisions.saveMuseumGuideDecision(input, { ...actor, canManage: false }, guideLoader), /curator/);
  let result = await decisions.saveMuseumGuideDecision(input, actor, guideLoader);
  assert.equal(result.decision!.decision, "deferred"); assert.equal(result.decision!.version, 1);
  assert.equal((await decisions.saveMuseumGuideDecision(input, actor, guideLoader)).replayed, true);
  await assert.rejects(decisions.saveMuseumGuideDecision({ ...input, note: "Different retry" }, actor, guideLoader), /different suggestion/);
  const decline = { ...input, expectedVersion: 1, clientRequestId: randomUUID(), decision: "declined" };
  result = await decisions.saveMuseumGuideDecision(decline, actor, guideLoader);
  assert.equal(result.decision!.version, 2);
  await assert.rejects(decisions.saveMuseumGuideDecision({ ...decline, clientRequestId: randomUUID() }, actor, guideLoader), /reviewed elsewhere/);
  result = await decisions.saveMuseumGuideDecision({ ...decline, expectedVersion: 2, clientRequestId: randomUUID(), decision: "pending" }, actor, guideLoader);
  assert.equal(result.decision!.decision, "pending"); assert.equal(result.decision!.version, 3);
  assert.equal((await decisions.readMuseumGuideDecisions("fixture-v2", guideLoader)).decisions.length, 0);
  await assert.rejects(decisions.saveMuseumGuideDecision({ ...input, suggestionId: "unknown" }, actor, guideLoader), /not in the pinned guide/);
  await assert.rejects(decisions.saveMuseumGuideDecision({ ...input, contentDigest: "c".repeat(64) }, actor, guideLoader), /content changed/);
  assert.equal(decisions.guideDecisionInput.safeParse({ ...input, records: [] }).success, false);
  assert.equal(await db.museumMoveCurrentLocation.count(), 0); assert.equal(await db.museumArrangement.count(), 0);
  assert.equal(await db.museumMoveSession.count(), 0); assert.deepEqual(snapshot, before);
  const request = async (ids: string[], to: { kind: "table" | "vitrine"; code: string; label: string }, clearedVitrines?: string[]) => {
    const view = await physical.readMuseumPhysicalLocations(loader, ids);
    return { museumId: "museum-spn", clientRequestId: randomUUID(), confirmedDate: "2026-10-27", datePrecision: "date", evidence: "Explicit fixture confirmation", physicalConfirmation: true, inventoryAcknowledged: true, guideContext: starterGuideContext, clearedVitrines,
      records: view.rows.map(row => ({ sourceId: row.sourceId, saintId: row.saintId, expectedCurrentRevision: row.currentRevision, expectedSourceRevision: row.sourceRevision, expectedLocationVersion: row.currentVersion, to })) };
  };
  const staging = { kind: "table" as const, code: "staging-area", label: "Staging area" };
  await assert.rejects(physical.confirmMuseumPhysicalLocations(await request(["a"], staging, ["2"]), actor, loader), /every listed display/);
  const clear = await request(["a", "b"], staging, ["2"]);
  const cleared = await physical.confirmMuseumPhysicalLocations(clear, actor, loader);
  assert.ok(cleared.rows.every(row => row.current?.kind === "table"));
  const receipt = cleared.receipt.afterJson as { emptyCaseClaim: string; clearedVitrines: string[] };
  assert.equal(receipt.emptyCaseClaim, "curator_confirmed_at_event_time"); assert.deepEqual(receipt.clearedVitrines, ["2"]);
  assert.deepEqual(cleared.rows.find(row => row.sourceId === "b")!.proposalDestination, vitrine("2"));
  await physical.confirmMuseumPhysicalLocations(await request(["a"], vitrine("28")), actor, loader);
  assert.equal((await physical.readMuseumPhysicalLocations(loader, ["a"])).rows[0].current!.code, "28");
  assert.equal((await physical.confirmMuseumPhysicalLocations(clear, actor, loader)).replayed, true);
  assert.equal((await physical.readMuseumPhysicalLocations(loader, ["a"])).rows[0].current!.code, "28");
  await assert.rejects(physical.confirmMuseumPhysicalLocations(await request([], staging, ["28"]), actor, loader), /every listed display/);
  const empty = await physical.confirmMuseumPhysicalLocations(await request([], staging, ["5"]), actor, loader);
  assert.equal((empty.receipt.afterJson as { emptyCaseClaim: string }).emptyCaseClaim, "curator_confirmed_at_event_time");
  await assert.rejects(physical.confirmMuseumPhysicalLocations(await request(["b"], { ...staging, code: "other-table" }), actor, loader), /Staging area/);
  assert.deepEqual(snapshot, before);
  assert.equal((await decisions.readMuseumGuideDecisions("fixture-v1", guideLoader)).decisions[0].version, 3);
  assert.equal(await db.museumMoveSession.count(), 0); assert.equal(await db.museumArrangement.count(), 0);
  assert.equal(await db.saint.count(), 0);
  console.log("PASS: defer/decline/restore persistence, receipt retries/CAS/version pins, physical independence, explicit all-content clearing including returners, partial/current staging, deliberate alternative target and no session/proposal/source writes.");
} finally { await db.$disconnect(); }
