import {canPlacePagalComponent,isPagalComponentPlaced} from "./spn-pagal-component-placement";
import type {ComponentPlacement} from "./museum-component-clearance-domain";
import type {CompanionAddition} from "./museum-companion-additions-state";
import overlay from "../data/museum/spn-approved-proposal-overlay-v1.json";
import {isActiveSpnObservation} from "./spn-observation-suppression";
type CurrentSource={sourceId:string;saintId:string|null;sourceRevision:string;identityChanged:boolean;componentPlacement?:ComponentPlacement|null;fixedHousing?:boolean;verifiedItemIds?:string[]};
export function currentCompanionAdditions(additions:CompanionAddition[],rows:CurrentSource[]){
 const sources=new Map(rows.map(row=>[row.sourceId,row]));
 return additions.filter(addition=>{
  const row=sources.get(addition.sourceId);
  return row&&(!addition.componentScope||(canPlacePagalComponent(row,addition.vitrine)||isPagalComponentPlaced(row,addition.vitrine)))&&row.saintId===addition.saintId&&row.sourceRevision===addition.sourceRevision&&!row.identityChanged&&isActiveSpnObservation(row.sourceId)&&!overlay.excludedFromMuseumDisplay.some(item=>item.sourceId===row.sourceId);
 });
}
