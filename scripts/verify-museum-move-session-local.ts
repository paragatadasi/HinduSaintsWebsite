import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import pg from "pg";
import type { MoveSnapshot } from "../lib/museum-move-session-domain";
const url = new URL(process.env.DATABASE_URL || "postgresql://invalid/invalid");
if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !url.pathname.startsWith("/museum_move_session_test")) throw new Error("Use a fresh disposable localhost museum_move_session_test database.");
const sql = new pg.Client({ connectionString: url.href });await sql.connect();
for (const name of (await readdir("prisma/migrations")).filter(name => /^\d/.test(name)).sort()) await sql.query(await readFile(`prisma/migrations/${name}/migration.sql`,"utf8"));
await sql.end();
const { db } = await import("../lib/db");
const api = await import("../lib/museum-move-session-service");
const curator = { id: "curator-test", canManage: true }, assistant = { id: "assistant-test", canManage: false };
const vitrine = (code:string) => ({ kind: "vitrine" as const, code, label: `Vitrine${code}` });
const snapshot:MoveSnapshot = { proposalVersion: "test-v1", title: "Session test", vitrineCodes: ["1","2","3"], guidance: { version: "g1", reviewStatus: "pending fit" }, rows: [
  { sourceId: "a", saintId: "same-saint", name: "RelicA", sourceReported: vitrine("1"), destination: vitrine("2"), holdReason: "", fixedHousing: false },
  { sourceId: "b", saintId: "same-saint", name: "RelicB", sourceReported: vitrine("2"), destination: vitrine("3"), holdReason: "", fixedHousing: false },
  { sourceId: "fixed", saintId: null, name: "Fixed object", sourceReported: vitrine("1"), destination: vitrine("1"), holdReason: "Fixed", fixedHousing: true },
  { sourceId: "unknown", saintId: null, name: "Unknown origin", sourceReported: null, destination: vitrine("3"), holdReason: "Find first", fixedHousing: false }
] };
const loader = async(version:string) => { assert.equal(version,snapshot.proposalVersion);return structuredClone(snapshot); };
try {
  const create = { museumId: "museum-spn", proposalVersion: snapshot.proposalVersion, clientRequestId: randomUUID() };
  await assert.rejects(api.startMuseumMoveSession(create,assistant,loader), /curator/);
  let { session } = await api.startMuseumMoveSession(create,curator,loader);
  assert.equal((await api.startMuseumMoveSession(create,curator,loader)).session.id,session.id);
  assert.deepEqual(session.tables,[{id:"staging-area",label:"Staging area"}]);
  assert.equal(session.rows.find(row=>row.sourceId==="unknown")!.currentBasis,"unknown");
  const action = () => ({ sessionId: session.id, expectedSessionVersion: session.version, clientRequestId: randomUUID() });
  const move = (moves:{sourceId:string;expectedLocationVersion:number;to:unknown}[]) => ({ ...action(), action:"move", moves:moves.map(move=>({...move,expectedCurrentRevision:session.rows.find(row=>row.sourceId===move.sourceId)!.currentRevision})), physicalConfirmation:true, inventoryAcknowledged:true });
  await assert.rejects(api.updateMuseumMoveSession(move([{ sourceId:"a",expectedLocationVersion:0,to:{kind:"table",code:"A",label:"TableA"} }]),curator),/Staging area/);

  const unknownStale=move([{sourceId:"unknown",expectedLocationVersion:0,to:vitrine("3")}]);
  await db.auditEvent.create({data:{userId:curator.id,action:"museum.arrangement.updated",entityType:"MuseumArrangement",entityId:"unknown",afterJson:{museumId:"museum-spn",status:"Implemented",vitrine:"1",confirmedAt:new Date().toISOString()}}});
  await assert.rejects(api.updateMuseumMoveSession(unknownStale,curator),/physical location changed/);
  session=(await api.readMuseumMoveSession("museum-spn")).session!;
  assert.equal(session.rows.find(row=>row.sourceId==="unknown")!.current!.code,"1");
  assert.equal(session.rows.find(row=>row.sourceId==="unknown")!.original,null);
  const direct=move([{sourceId:"a",expectedLocationVersion:0,to:vitrine("2")}]);
  ({session}=await api.updateMuseumMoveSession(direct,curator));
  assert.equal(session.rows.find(row=>row.sourceId==="a")!.current!.code,"2");
  assert.equal(session.rows.find(row=>row.sourceId==="b")!.current!.code,"2"); // Direct arrival never displaces an occupied record.
  assert.equal(session.rows.find(row=>row.sourceId==="b")!.currentBasis,"source");
  assert.equal((await api.updateMuseumMoveSession(direct,curator)).session.version,session.version);
  await assert.rejects(api.updateMuseumMoveSession({...direct,note:"Different retry"},curator),/different action/);
  const before=await db.museumMoveCurrentLocation.count();
  await assert.rejects(api.updateMuseumMoveSession(move([{sourceId:"a",expectedLocationVersion:1,to:vitrine("3")},{sourceId:"b",expectedLocationVersion:99,to:vitrine("3")}]),curator),/moved since/);
  assert.equal(await db.museumMoveCurrentLocation.count(),before);
  await assert.rejects(api.updateMuseumMoveSession(move([{sourceId:"fixed",expectedLocationVersion:0,to:vitrine("2")}]),curator),/fixed or special/);
  await assert.rejects(api.updateMuseumMoveSession({...move([{sourceId:"a",expectedLocationVersion:1,to:{kind:"table",code:"staging-area",label:"ignored"}}]),clearedVitrines:["2"]},curator),/every listed/);
  ({session}=await api.updateMuseumMoveSession({...move([{sourceId:"a",expectedLocationVersion:1,to:{kind:"table",code:"staging-area",label:"ignored"}},{sourceId:"b",expectedLocationVersion:0,to:{kind:"table",code:"staging-area",label:"ignored"}}]),clearedVitrines:["2"]},curator));
  assert.equal(session.rows.find(row=>row.sourceId==="a")!.current!.label,"Staging area");
  await assert.rejects(api.updateMuseumMoveSession({...action(),action:"close"},curator),/remain in the Staging area/);
  await assert.rejects(api.updateMuseumMoveSession(move([{sourceId:"a",expectedLocationVersion:2,to:vitrine("3")}]),assistant),/curator/);
  ({session}=await api.updateMuseumMoveSession(move([{sourceId:"a",expectedLocationVersion:2,to:vitrine("3")},{sourceId:"b",expectedLocationVersion:1,to:vitrine("3")}]),curator));
  assert.equal(session.rows.find(row=>row.sourceId==="a")!.sourceReported!.code,"1");
  assert.equal((session.rows.find(row=>row.sourceId==="a")!.sessionStarting as {location:{code:string}}).location.code,"1");
  ({session}=await api.updateMuseumMoveSession({...action(),action:"close"},curator));
  const oldId=session.id; snapshot.proposalVersion="test-v2";snapshot.rows[0].destination=vitrine("1");
  const second=await api.startMuseumMoveSession({...create,clientRequestId:randomUUID(),proposalVersion:snapshot.proposalVersion},curator,loader);
  assert.equal(second.session.rows.find(row=>row.sourceId==="a")!.original!.code,"1");
  assert.equal((second.session.rows.find(row=>row.sourceId==="a")!.sessionStarting as {location:{code:string}}).location.code,"3");
  assert.equal(second.session.rows.find(row=>row.sourceId==="a")!.currentConfirmed!.location.code,"3");
  assert.equal((await api.readMuseumMoveSession("museum-spn",oldId)).session!.proposalVersion,"test-v1");
  assert.equal(await db.museumCollectionItem.count(),0);
  console.log("PASS: pinned source/session/current separation; generic staging; direct occupied-case transfer; atomic stale rejection; idempotency; fixed-object protection; no review/assistant mutation; proposal updates retain physical history.");
} finally { await db.$disconnect(); }
