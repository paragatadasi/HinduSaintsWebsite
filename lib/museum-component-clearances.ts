import {createHash} from "node:crypto";
import {pagalComponentReceiptId,pagalComponentDestination,pagalComponentAcknowledgement} from "./spn-pagal-component-placement";
import {v19ComponentBinding} from "./museum-component-clearance-domain";
import { db } from "./db";
import type { Prisma } from "./generated/prisma/client";
import { componentSourceIds,componentOriginCode,componentScopeForOrigin, type ComponentPlacement } from "./museum-component-clearance-domain";
import { moveLocation } from "./museum-move-session-domain";

export async function readComponentCorrections(tx: Prisma.TransactionClient = db) {
  const events=await tx.auditEvent.findMany({where:{action:"museum.physical_location.check_undone",entityType:"MuseumPhysicalCheckUndo",
    OR:[{afterJson:{path:["scope"],equals:"vitrine_64_contents_only"}},{afterJson:{path:["scope"],equals:"vitrine_20_contents_only"}},{afterJson:{path:["scope"],equals:"vitrine_19_contents_only"}},{afterJson:{path:["scope"],equals:"vitrine_42_contents_only"}},{afterJson:{path:["scope"],equals:"vitrine_64_contents_including_sticks"}}]},select:{afterJson:true}});
  return events.flatMap(({afterJson:value})=>value&&typeof value==="object"&&!Array.isArray(value)&&value.museumId==="museum-spn"&&
    typeof value.targetReceiptId==="string"&&typeof value.sourceId==="string"?[{receiptId:value.targetReceiptId,sourceId:value.sourceId,revision:createHash("sha256").update(JSON.stringify(value)).digest("hex")}]:[]);
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
          !componentSourceIds.some(id => id === raw.sourceId) || found.has(raw.sourceId) ||
          corrections.some(c=>c.receiptId===event.id&&c.sourceId===raw.sourceId)) continue;
      const origin = moveLocation.safeParse(raw.origin), location = moveLocation.safeParse(raw.location);
      const code=componentOriginCode(raw.sourceId);
      const ordinary=value.ordinaryComponentConfirmation===true&&value.excludedComponentsUnchanged===true;
      if(ordinary&&raw.previousComponentReceiptId)continue;
      const scope=ordinary&&code==="64"?"vitrine_64_contents_only":componentScopeForOrigin(code??"");
      if (!code||!origin.success || !location.success || origin.data.kind !== "vitrine" || origin.data.code !== code ||
          (!ordinary&&(location.data.kind !== "table" || location.data.code !== "staging-area")) || raw.scope !== scope ||
          typeof raw.revision !== "string" || typeof raw.expectedSourceRevision !== "string" ||
          typeof raw.previousCurrentRevision !== "string" || typeof raw.previousLocationVersion !== "number" || code==="64"&&!ordinary&&raw.includedWalkingSticks!==true) continue;
      found.set(raw.sourceId, { sourceId: raw.sourceId, receiptId: event.id, recordedAt: event.createdAt.toISOString(),
        revision: raw.revision, locationVersion:raw.previousLocationVersion+1, origin: origin.data, location: location.data, scope: scope!,
        excludedWalkingSticks: { location: null, status: "unverified" }, expectedSourceRevision: raw.expectedSourceRevision,
        ...(raw.includedWalkingSticks===true?{includedWalkingSticks:true as const}:{}),
        previousCurrentRevision: raw.previousCurrentRevision, previousLocationVersion: raw.previousLocationVersion });
    }
  }
  // Continuations change only the explicitly staged component; the source ledger remains untouched.
  for(const event of [...events].reverse()){
    const value=event.afterJson;if(!value||typeof value!=="object"||Array.isArray(value)||value.museumId!=="museum-spn"||!Array.isArray(value.componentMoves))continue;
    for(const raw of value.componentMoves){
      if(raw&&typeof raw==="object"&&!Array.isArray(raw)&&typeof raw.sourceId==="string"&&value.ordinaryComponentConfirmation===true&&value.excludedComponentsUnchanged===true&&raw.previousComponentReceiptId){
        const previous=found.get(raw.sourceId),location=moveLocation.safeParse(raw.location);
        if(!previous||raw.previousComponentReceiptId!==previous.receiptId||raw.previousComponentRevision!==previous.revision||raw.scope!==previous.scope||raw.expectedSourceRevision!==previous.expectedSourceRevision||raw.previousCurrentRevision!==previous.previousCurrentRevision||raw.previousLocationVersion!==previous.previousLocationVersion||typeof raw.revision!=="string"||!location.success)continue;
        const correction=corrections.find(c=>c.receiptId===event.id&&c.sourceId===raw.sourceId);
        if(correction){found.set(raw.sourceId,{...previous,locationVersion:(previous.locationVersion??previous.previousLocationVersion)+1,revision:createHash("sha256").update(JSON.stringify({previousRevision:previous.revision,correction:correction.revision})).digest("hex")});continue;}
        found.set(raw.sourceId,{...previous,receiptId:event.id,clearanceReceiptId:previous.clearanceReceiptId??previous.receiptId,recordedAt:event.createdAt.toISOString(),revision:raw.revision,locationVersion:(previous.locationVersion??previous.previousLocationVersion)+1,location:location.data});
        continue;
      }
      if(!raw||typeof raw!=="object"||Array.isArray(raw)||raw.sourceId!==v19ComponentBinding.sourceId||raw.clearanceReceiptId!==pagalComponentReceiptId)continue;
      const previous=found.get(raw.sourceId),location=moveLocation.safeParse(raw.location);
      if(!pagalComponentAcknowledgement.safeParse(value.componentPlacementAcknowledgement).success||!previous||previous.receiptId!==pagalComponentReceiptId||raw.previousComponentReceiptId!==previous.receiptId||raw.previousComponentRevision!==previous.revision||raw.scope!==previous.scope||raw.expectedSourceRevision!==previous.expectedSourceRevision||raw.previousCurrentRevision!==previous.previousCurrentRevision||raw.previousLocationVersion!==previous.previousLocationVersion||typeof raw.revision!=="string"||!location.success||location.data.kind!=="vitrine"||location.data.code!==pagalComponentDestination)continue;
      const correction=corrections.find(c=>c.receiptId===event.id&&c.sourceId===raw.sourceId);
      if(correction){found.set(raw.sourceId,{...previous,locationVersion:(previous.locationVersion??previous.previousLocationVersion)+1,revision:createHash("sha256").update(JSON.stringify({previousRevision:previous.revision,correction:correction.revision})).digest("hex")});continue;}
      found.set(raw.sourceId,{...previous,receiptId:event.id,clearanceReceiptId:pagalComponentReceiptId,recordedAt:event.createdAt.toISOString(),revision:raw.revision,locationVersion:(previous.locationVersion??previous.previousLocationVersion)+1,location:location.data});
    }
  }
  return [...found.values()];
}
