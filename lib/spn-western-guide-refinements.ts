import refinements from "../data/museum/spn-western-additions-v1.json";
import type {StarterMoveGuide} from "./spn-move-guide";

/** Reviewed display-local wording only; never rewrites canonical geography or physical locations. */
export function applyWesternGuideRefinements(guide:StarterMoveGuide):StarterMoveGuide {
 const applicable=new Map(refinements.map(row=>[row.sourceId,row]));
 const entries=guide.entries.map(entry=>{
  const detail=applicable.get(entry.sourceId);
  if(!detail||detail.saintId!==entry.saintId||detail.destination!==entry.destination)return entry;
  return {...entry,city:detail.city,reviewNotes:[...new Set([...(entry.reviewNotes??[]),...(detail.note?[detail.note]:[])])]};
 });
 return {...guide,entries,vitrines:guide.vitrines.map(v=>{
  const fit=v.code==="41"?"Estimated 5.05 shelf spaces plus unknown sizes; check fit.":v.code==="42"?"Estimated 5.82 shelf spaces; check fit.":"";
  return {...v,summary:fit&&!v.summary.includes(fit)?`${v.summary} · ${fit}`:v.summary,
   cityGroups:v.cityGroups.flatMap(group=>{
    if(group.id!=="curator-additions:"+v.code)return [group];
    const groups=new Map<string,typeof group>();
    for(const id of group.sourceIds){const entry=entries.find(row=>row.sourceId===id),detail=applicable.get(id);
     const title=detail&&entry?.saintId===detail.saintId&&detail.destination===v.code?detail.title:group.title;
     const current=groups.get(title)??{...group,id:`${group.id}:${title}`,title,sourceIds:[]};
     current.sourceIds.push(id);groups.set(title,current);
    }
    return [...groups.values()];
   })};
 })};
}
