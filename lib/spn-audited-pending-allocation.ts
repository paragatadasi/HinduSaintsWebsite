import west from "../data/museum/spn-west-mount-abu-v6.json";
import packet from "../data/museum/spn-audited-pending-allocation-v1.json";
import type {CompanionRow} from "./spn-move-guide";
import type {ExplorerObservation} from "./spn-room-proposal";
import type {MuseumSaintPlacement} from "./museum-proposals";

// Reviewed regional omissions, 1 November 2026. Absence from a shelf plan alone is not evidence of pending allocation.
export const auditedPendingAllocations:Record<string,string>={
 ...Object.fromEntries(west.pending.map(row=>[row.sourceId,"Optional Gujarat placement deferred; locality and fit remain to review."])),
 recIE7h4k6e7GJnGa:"Karnataka placement needs a fit review.",
 rec2nZkEPSKUov5Tj:"Review identity, family and fit before choosing a destination.",
 reczP3YscrJXar1R9:"Confirm the locality before choosing a destination.",
 recyk3KlMHvT4dYKJ:"Locality needs review; allow bottom-shelf space for a living saint.",
 rec8CiqYCE8loBuDl:"Fixed housing: review the housing restriction before changing placement."
};
export function projectAuditedPendingAllocations(rows:ExplorerObservation[],current:MuseumSaintPlacement[],overrides:{sourceId:string;vitrine:string;version?:number}[]=[],sources:Pick<CompanionRow,"sourceId"|"saintId"|"sourceRevision"|"identityChanged">[]=[]){
 return rows.flatMap(row=>{
  const reason=auditedPendingAllocations[row.sourceId];
  const deferred=west.pending.find(item=>item.sourceId===row.sourceId);
  const captured=deferred??packet.sources.find(item=>item.sourceId===row.sourceId);
  const source=sources.find(item=>item.sourceId===row.sourceId);
  if(!captured||!source||source.identityChanged||source.saintId!==captured.saintId||row.saintId!==captured.saintId||source.sourceRevision!==captured.sourceRevision)return [];
  if(!reason||overrides.some(item=>item.sourceId===row.sourceId&&item.vitrine.trim()&&(!deferred||item.vitrine!==deferred.oldProposal||item.version!==deferred.additionVersion)))return [];
  const live=current.find(item=>item.sourceRecordId===row.sourceId&&item.saintId===row.saintId);
  const saved=live?.arrangement;
  if(saved?.vitrine&&["Planned","Implemented"].includes(saved.status)&&(!row.baseline||saved.revision!==row.baseline.revision))return [];
  return [{sourceId:row.sourceId,name:row.name,previousVitrine:row.effectiveVitrine,reason}];
 });
}
