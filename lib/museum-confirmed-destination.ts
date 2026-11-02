import type {ComponentPlacement} from "./museum-component-clearance-domain";

type Location={kind:string;code:string;shelf?:string};
type Source={sourceId:string;sourceRevision:string;identityChanged:boolean;currentBasis:string;current:Location|null;currentConfirmed?:{confirmedAt:string}|null;componentPlacement?:ComponentPlacement|null};
export type ConfirmedDestination={vitrine:string;shelf:string|null;confirmedAt:string;componentScope?:ComponentPlacement["scope"]};

export function confirmedCompanionDestination(row:Source,latestPlanAt?:string|null):ConfirmedDestination|null {
 if(row.identityChanged)return null;
 const component=row.componentPlacement;
 if(component&&(component.sourceId!==row.sourceId||component.expectedSourceRevision!==row.sourceRevision))return null;
 const location=component?.location??row.current;
 const confirmedAt=component?.recordedAt??(row.currentBasis==="confirmed"?row.currentConfirmed?.confirmedAt:null);
 if(!location||location.kind!=="vitrine"||!confirmedAt||!Number.isFinite(Date.parse(confirmedAt)))return null;
 // A later intentional plan can differ from the still-recorded physical location.
 if(latestPlanAt&&(!Number.isFinite(Date.parse(latestPlanAt))||Date.parse(latestPlanAt)>=Date.parse(confirmedAt)))return null;
 return {vitrine:location.code,shelf:location.shelf??null,confirmedAt,...(component?{componentScope:component.scope}:{})};
}

export function confirmedCompanionDestinations(rows:Source[],plans:{sourceId:string;updatedAt:string}[],updates:Map<string,string>,placements:{sourceRecordId?:string;id:string}[],excluded:(sourceId:string)=>boolean){
 const bySource=new Map(placements.filter(p=>p.sourceRecordId).map(p=>[p.sourceRecordId!,p]));
 return rows.flatMap(row=>{
  if(excluded(row.sourceId))return [];
  const placement=bySource.get(row.sourceId);
  const dates=[...plans.filter(p=>p.sourceId===row.sourceId).map(p=>p.updatedAt),updates.get(row.sourceId),placement?updates.get(placement.id):undefined].filter((date):date is string=>!!date).sort();
  const confirmed=confirmedCompanionDestination(row,dates.at(-1));
  return confirmed?[{sourceId:row.sourceId,...confirmed}]:[];
 });
}
