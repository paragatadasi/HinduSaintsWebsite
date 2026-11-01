import {companionRows,type CompanionPhase} from "./museum-companion-navigation";
import {companionVitrineOwner} from "./museum-companion-addition-projection";
import {vitrineProgress} from "./museum-vitrine-progress";
import type {StarterMoveGuide,CompanionRow,GuideDecision} from "./spn-move-guide";

export function museumProgressSummary(guides:Record<CompanionPhase,StarterMoveGuide>,rows:CompanionRow[],decisions:Record<string,GuideDecision[]>){
 const seen=new Set<string>();
 const regions=companionRows.map(region=>{
  const vitrines=region.phases.flatMap(owner=>{
   const guide=guides[owner];
   return (guide?.vitrines??[]).filter(v=>companionVitrineOwner(guides,v.code)===owner).map(v=>{
    const groups=[...v.families,...v.cityGroups];
    // Count each source once across the available guides, including overlapping families.
    const ownIds=new Set(groups.flatMap(g=>g.sourceIds).filter(id=>!seen.has(id)));
    for(const id of ownIds)seen.add(id);
    const progress=vitrineProgress(v.code,groups.map(g=>({...g,sourceIds:g.sourceIds.filter(id=>ownIds.has(id))})),rows,decisions[guide.version]??[]);
    return {code:v.code,owner,...progress};
   });
  });
  return {...region,vitrines,...sum(vitrines)};
 }).filter(region=>region.vitrines.length);
 return {regions,...sum(regions)};
}
function sum(items:{total:number;addressed:number;deferred:number}[]){
 return items.reduce((a,b)=>({total:a.total+b.total,addressed:a.addressed+b.addressed,deferred:a.deferred+b.deferred}),{total:0,addressed:0,deferred:0});
}
