import { z } from "zod";
import { db } from "./db";
import { Prisma } from "./generated/prisma/client";
import { SPN_WEBSITE_AIRTABLE_BASE_ID as base } from "./museum-vitrine-source";
import { fingerprint, reviewMuseumSources, sourceKey, type SourceRow } from "./museum-update-domain";

const lock = () => Prisma.sql`SELECT pg_advisory_xact_lock(8496219)::text`;
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const lease = () => new Date(Date.now() + 20 * 60 * 1000);
function configuration() {
  const token = process.env.AIRTABLE_ACCESS_TOKEN ?? process.env.AIRTABLE_PAT;
  if (process.env.AIRTABLE_BASE_ID !== base || !token) throw Error("Configure the SPN Website Airtable connection before running updates.");
  if (process.env.AIRTABLE_VIEW?.trim()) throw Error("Museum updates require the full base. Remove the Airtable view filter before continuing.");
  return token;
}
export async function startMuseumUpdate(actorId: string) {
  configuration();
  return db.$transaction(async tx => {
    await tx.$queryRaw(lock());
    await tx.museumUpdateJob.updateMany({ where: { status: { in: ["queued", "running"] }, leaseUntil: { lt: new Date() } },
      data: { status: "interrupted", progress: "Interrupted update. Start another check to retry safely.", completedAt: new Date() } });
    const active = await tx.museumUpdateJob.findFirst({ where: { status: { in: ["queued", "running"] } } });
    if (active) return { job: active, started: false };
    const job = await tx.museumUpdateJob.create({ data: { actorId, baseId: base, leaseUntil: lease(), progress: "Waiting to fetch Saints and Relics." } });
    await tx.auditEvent.create({ data: { userId: actorId, action: "museum.update.started", entityType: "MuseumUpdateJob", entityId: job.id, afterJson: { baseId: base } } });
    return { job, started: true };
  });
}
const pageSchema = z.object({ records: z.array(z.object({ id: z.string().regex(/^rec[a-zA-Z0-9]+$/), createdTime: z.string().datetime().optional(), fields: z.record(z.string(), z.unknown()) })).max(100), offset: z.string().optional() });
async function fetchTable(table: string, token: string, progress: (message: string) => Promise<void>) {
  const rows: SourceRow[] = []; const ids = new Set<string>(); const offsets = new Set<string>(); let offset: string | undefined;
  do {
    const url = new URL(`https://api.airtable.com/v0/${base}/${table}`);
    url.searchParams.set("pageSize", "100"); if (offset) url.searchParams.set("offset", offset);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw Error(`Airtable ${table} returned HTTP ${response.status}. Nothing was applied; retry the check.`);
    const page = pageSchema.parse(await response.json());
    for (const row of page.records) { if (ids.has(row.id)) throw Error("Repeated source record; refresh aborted."); ids.add(row.id); rows.push(row); }
    if (rows.length > 20000) throw Error("Source exceeds the supported review size.");
    offset = page.offset;
    if (offset) { if (offsets.has(offset)) throw Error("Repeated source page; refresh aborted."); offsets.add(offset); }
    await progress(`Reading ${table}: ${rows.length} records.`);
    await new Promise(resolve => setTimeout(resolve, 250));
  } while (offset);
  if (!rows.length) throw Error(`Empty ${table} source; refresh aborted for review.`);
  return rows;
}
const mirrorWhere = { baseId: base, tableIdOrName: { in: ["Saints", "Relics"] } };
const mirrorSelect = { baseId: true, tableIdOrName: true, recordId: true, rawFieldsJson: true, rawPayloadJson: true } as const;
function mirrorHash(rows: Array<{ tableIdOrName: string; recordId: string; rawFieldsJson: unknown }>) {
  return fingerprint(rows.map(r => [r.tableIdOrName, r.recordId, r.rawFieldsJson]).sort((a,b) => String(a.slice(0,2)).localeCompare(String(b.slice(0,2)))));
}
export async function runMuseumUpdate(id: string) {
  const claimed = await db.museumUpdateJob.updateMany({ where: { id, status: "queued", leaseUntil: { gt: new Date() } }, data: { status: "running", leaseUntil: lease() } });
  if (!claimed.count) return;
  try {
    const token = configuration();
    const before = await db.airtableMirrorRecord.findMany({ where: mirrorWhere, select: mirrorSelect });
    const progress = async (message: string) => {
      const result = await db.museumUpdateJob.updateMany({ where: { id, status: "running", leaseUntil: { gt: new Date() } }, data: { progress: message, leaseUntil: lease() } });
      if (!result.count) throw Error("Update lease expired. Start a new check.");
    };
    const tables = { Saints: await fetchTable("Saints",token,progress), Relics: await fetchTable("Relics",token,progress) };
    for (const table of ["Saints", "Relics"] as const) {
      const present = new Set(tables[table].map(r => r.id));
      if (before.some(r => r.tableIdOrName === table && !present.has(r.recordId))) throw Error("Previously mirrored rows are absent from the source. No changes applied; a data administrator must review source completeness.");
    }
    await progress("Applying the complete refresh and preparing uncertain matches.");
    await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "MuseumUpdateJob" WHERE id = ${id} FOR UPDATE`;
      const job = await tx.museumUpdateJob.findUniqueOrThrow({ where: { id } });
      if (job.status !== "running" || job.leaseUntil < new Date()) throw Error("Update lease expired before applying.");
      const current = await tx.airtableMirrorRecord.findMany({ where: mirrorWhere, select: mirrorSelect });
      if (mirrorHash(before) !== mirrorHash(current)) throw Error("The mirror changed during this check. No changes applied; retry.");
      const links = await tx.externalRecord.findMany({ where: { sourceType: "airtable", externalId: { startsWith: base + ":Saints:" } }, select: { externalId: true, entityType: true, entityId: true } });
      const saints = await tx.saint.findMany({ where: { status: { not: "archived" } }, select: { id: true } });
      const active = new Set(saints.map(s => s.id));
      const previous = reviewMuseumSources(current.filter(r => r.tableIdOrName === "Saints").map(r => ({ id: r.recordId, fields: r.rawFieldsJson as Record<string,unknown> })), links, active);
      const next = reviewMuseumSources(tables.Saints, links, active);
      const batch = await tx.importBatch.create({ data: { sourceType: "airtable", sourceName: "SPN museum update", status: "running" } });
      const now = new Date();
      for (const table of ["Saints", "Relics"] as const) for (const row of tables[table]) {
        const old = current.find(r => r.tableIdOrName === table && r.recordId === row.id);
        const oldPayload = old?.rawPayloadJson as Record<string, unknown> | undefined;
        const payload = { baseId: base, table, ...(typeof oldPayload?.tableId === "string" ? { tableId: oldPayload.tableId } : {}), record: row };
        const values = { rawFieldsJson: json(row.fields), rawPayloadJson: json(payload), sourceImportBatchId: batch.id, importedAt: now, lastSeenAt: now };
        await tx.airtableMirrorRecord.upsert({ where: { baseId_tableIdOrName_recordId: { baseId: base, tableIdOrName: table, recordId: row.id } },
          create: { ...values, baseId: base, tableIdOrName: table, recordId: row.id, airtableCreatedTime: row.createdTime ? new Date(row.createdTime) : null }, update: values });
        await tx.externalRecord.upsert({ where: { sourceType_externalId: { sourceType: "airtable", externalId: sourceKey(table,row.id) } },
          create: { sourceType: "airtable", externalId: sourceKey(table,row.id), entityType: `airtable:${table}`, rawPayloadJson: json(payload), importedAt: now, lastSeenAt: now },
          update: { rawPayloadJson: json(payload), lastSeenAt: now } });
      }
      const existingReviews = await tx.museumSourceReview.findMany({ where: { sourceKey: { startsWith: base + ":Saints:" } } });
      for (const review of next.reviews) {
        const old = existingReviews.find(r => r.sourceKey === review.sourceKey);
        if (old?.sourceHash === review.sourceHash && ["pending", "deferred"].includes(old.status)) continue;
        if (old) await tx.auditEvent.create({ data: { userId: job.actorId, action: "museum.source.evidence_changed", entityType: "MuseumSourceReview", entityId: old.id,
          beforeJson: json({ snapshot: old.snapshot, hash: old.sourceHash, status: old.status, note: old.note }), afterJson: json(review) } });
        await tx.museumSourceReview.upsert({ where: { sourceKey: review.sourceKey }, create: { ...review, snapshot: json(review.snapshot) },
          update: { ...review, snapshot: json(review.snapshot), status: "pending", note: null, reviewedById: null } });
      }
      const pendingKeys = new Set(next.reviews.map(r => r.sourceKey));
      for (const review of existingReviews) if (!pendingKeys.has(review.sourceKey) && review.status !== "resolved") {
        await tx.museumSourceReview.update({ where: { id: review.id }, data: { status: "resolved", note: "Source now resolves to a consistent location." } });
      }
      const updated = [...next.locations].filter(([key,value]) => fingerprint(previous.locations.get(key)) !== fingerprint(value)).length;
      const hidden = [...previous.locations.keys()].filter(key => !next.locations.has(key)).length;
      const summary = { saintsRead: tables.Saints.length, relicsRead: tables.Relics.length, updated, unchanged: next.locations.size - updated, hidden, awaitingReview: next.reviews.length, failed: 0 };
      await tx.importBatch.update({ where: { id: batch.id }, data: { status: "completed", completedAt: now, rawSummary: JSON.stringify(summary) } });
      await tx.museumUpdateJob.update({ where: { id }, data: { status: "completed", completedAt: now, progress: "Museum source update complete.", sourceSnapshot: json({ before: current, fetched: tables }), summary: json(summary) } });
      await tx.auditEvent.create({ data: { userId: job.actorId, action: "museum.update.completed", entityType: "MuseumUpdateJob", entityId: id, afterJson: json(summary) } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 120000, maxWait: 10000 });
  } catch (error) {
    // Never put remote response bodies, record values or credentials in job output.
    const safe = error instanceof Error && !error.message.includes("prisma") && error.message.length < 220 ? error.message : "Update failed. No mirror changes applied; retry or ask a data administrator.";
    await db.museumUpdateJob.updateMany({ where: { id, status: "running" }, data: { status: "failed", completedAt: new Date(), progress: safe } });
  }
}
