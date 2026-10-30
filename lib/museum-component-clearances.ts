import { db } from "./db";
import type { Prisma } from "./generated/prisma/client";
import { v20ComponentSourceIds, type ComponentPlacement } from "./museum-component-clearance-domain";
import { moveLocation } from "./museum-move-session-domain";

export async function readComponentCorrections(tx: Prisma.TransactionClient = db) {
  const events=await tx.auditEvent.findMany({where:{action:"museum.physical_location.check_undone",entityType:"MuseumPhysicalCheckUndo",
    afterJson:{path:["scope"],equals:"vitrine_20_contents_only"}},select:{afterJson:true}});
  return events.flatMap(({afterJson:value})=>value&&typeof value==="object"&&!Array.isArray(value)&&value.museumId==="museum-spn"&&
    typeof value.targetReceiptId==="string"&&typeof value.sourceId==="string"?[{receiptId:value.targetReceiptId,sourceId:value.sourceId}]:[]);
}

export async function readComponentPlacements(tx: Prisma.TransactionClient = db, correctionsRead?: ReturnType<typeof readComponentCorrections>): Promise<ComponentPlacement[]> {
  const [events,corrections] = await Promise.all([tx.auditEvent.findMany({ where: { action: "museum.physical_location.confirmed",
    entityType: "MuseumPhysicalConfirmation", afterJson: { path: ["scope"], equals: "source_observation_with_components" } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, createdAt: true, afterJson: true } }),correctionsRead??readComponentCorrections(tx)]);
  const found = new Map<string, ComponentPlacement>();
  for (const event of events) {
    const value = event.afterJson;
    if (!value || typeof value !== "object" || Array.isArray(value) || value.museumId !== "museum-spn" || !Array.isArray(value.componentMoves)) continue;
    for (const raw of value.componentMoves) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw) || typeof raw.sourceId !== "string" ||
          !v20ComponentSourceIds.some(id => id === raw.sourceId) || found.has(raw.sourceId) ||
          corrections.some(c=>c.receiptId===event.id&&c.sourceId===raw.sourceId)) continue;
      const origin = moveLocation.safeParse(raw.origin), location = moveLocation.safeParse(raw.location);
      if (!origin.success || !location.success || origin.data.kind !== "vitrine" || origin.data.code !== "20" ||
          location.data.kind !== "table" || location.data.code !== "staging-area" || raw.scope !== "vitrine_20_contents_only" ||
          typeof raw.revision !== "string" || typeof raw.expectedSourceRevision !== "string" ||
          typeof raw.previousCurrentRevision !== "string" || typeof raw.previousLocationVersion !== "number") continue;
      found.set(raw.sourceId, { sourceId: raw.sourceId, receiptId: event.id, recordedAt: event.createdAt.toISOString(),
        revision: raw.revision, origin: origin.data, location: location.data, scope: raw.scope,
        excludedWalkingSticks: { location: null, status: "unverified" }, expectedSourceRevision: raw.expectedSourceRevision,
        previousCurrentRevision: raw.previousCurrentRevision, previousLocationVersion: raw.previousLocationVersion });
    }
  }
  return [...found.values()];
}
