import {db} from "@/lib/db";
import type {Prisma} from "@/lib/generated/prisma/client";
import {projectVrindavanInventoryEntry} from "./museum-source-inventory-domain";

// PRIVATE server reader, never public content. Caller must enforce access_museum.
// This consumes existing reviewed observations; it creates no inventory or placements.
export async function readVrindavanMuseumInventory(
  options: {snapshotHash?: string} = {}, client: Prisma.TransactionClient = db
) {
  if (options.snapshotHash && !/^[a-f0-9]{64}$/.test(options.snapshotHash)) throw Error("Invalid inventory snapshot");
  const museum = await client.museum.findFirst({where:{id:"museum-vrindavan",archivedAt:null},select:{id:true,name:true,slug:true}});
  if (!museum) throw Error("Vrindavan museum unavailable");
  const observations = await client.museumCollectionImport.findMany({
    where:{museumId:museum.id,sourceKey:{startsWith:"vrindavan-workbook:"}},
    orderBy:[{observedAt:"desc"},{id:"desc"}]
  });
  const snapshots = [...new Set(observations.map(row => /^vrindavan-workbook:([a-f0-9]{64}):Sheet1:/.exec(row.sourceKey)?.[1]).filter((hash):hash is string => !!hash))];
  const snapshotHash = options.snapshotHash ?? snapshots[0] ?? null;
  if (options.snapshotHash && !snapshots.includes(options.snapshotHash)) throw Error("Inventory snapshot unavailable");
  const selected = observations.filter(row => row.sourceKey.startsWith(`vrindavan-workbook:${snapshotHash}:Sheet1:`));
  const active = await client.saint.findMany({where:{status:{not:"archived"}},select:{id:true,displayName:true,canonicalName:true,slug:true,status:true}});
  const activeIds = new Set(active.map(saint => saint.id));
  const entries = selected.flatMap(row => {
    const entry = projectVrindavanInventoryEntry(row,museum,activeIds);
    return entry ? [entry] : [];
  }).sort((a,b) => a.sourceRow-b.sourceRow || a.observationId.localeCompare(b.observationId));
  const saintIds = new Set(entries.flatMap(entry => entry.saintIds));
  const saints = active.filter(saint => saintIds.has(saint.id));
  const entriesBySaintId = new Map<string, typeof entries>();
  for (const entry of entries) for (const saintId of entry.saintIds) {
    const linked = entriesBySaintId.get(saintId) ?? []; linked.push(entry); entriesBySaintId.set(saintId,linked);
  }
  const displays = [...new Set(entries.map(entry => entry.displayText.trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  return {
    museum, snapshotHash, snapshots, entries, saints, entriesBySaintId, displays,
    counts: {
      sourceRows: selected.length, confirmedEntries: entries.length, linkedSaints: saintIds.size,
      awaitingIdentityReview: selected.filter(row => row.status !== "identity_linked").length,
      unavailableIdentityEntries: entries.filter(entry => entry.unavailableSaintIds.length).length,
      malformedConfirmedEntries: selected.filter(row => row.status === "identity_linked").length-entries.length,
      withSourceLocation: entries.filter(entry => entry.sourceLocation).length
    }
  };
}