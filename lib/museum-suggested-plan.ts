import {isFlexible,type PlannerData,type PlannerRow} from "./museum-move-planner-domain";
import {summarizeRelicPackaging} from "./museum-relic-packaging";

// Candidate areas are curatorial recommendations, not measured capacities.
export type SuggestedPlanGuide={version:string;areas:Record<string,string[]>;holds?:{saintId:string;reason:string;section?:string;familyKey?:string}[];affinities?:{section:string;traditionId:string}[]};
export type SuggestedPlan={
 version:string;revision:string;
 assignments:{id:string;vitrine:string}[];
 areas:{section:string;vitrines:string[];preserved:boolean}[];
 groups:{names:string[];vitrine:string;sections:string[];upper:number;frames:number;entries:number}[];
 held:{names:string[];reason:string}[];
};
export function buildSuggestedPlan(data:PlannerData,guide:SuggestedPlanGuide):SuggestedPlan{
 const orderedRows=[...data.rows].sort((a,b)=>a.id.localeCompare(b.id));
 const plan:SuggestedPlan={version:guide.version,revision:data.revision,assignments:[],areas:[],groups:[],held:[]};
 const available=new Map<string,string[]>();
 for(const section of data.sections){
  const saved=data.areas.find(a=>a.section===section.name&&a.vitrines.length);
  const vitrines=saved?.vitrines??guide.areas[section.name];
  if(vitrines?.length){available.set(section.name,vitrines);plan.areas.push({section:section.name,vitrines,preserved:!!saved});}
 }
 // Connected display groups and shared inventory records cannot be split by this assistant.
 const holds=new Map(guide.holds?.filter(hold=>data.rows.some(row=>row.saintId===hold.saintId&&(!hold.section||row.section===hold.section)&&(!hold.familyKey||row.familyKey===hold.familyKey))).map(hold=>[hold.saintId,hold.reason])??[]);
 const parents=new Map(data.rows.map(row=>[row.id,row.id]));
 function root(id:string):string{const parent=parents.get(id)!;return parent===id?id:root(parent);}
 function join(a:string,b:string){parents.set(root(b),root(a));}
 const keys=new Map<string,string>();
 for(const row of orderedRows)for(const key of [...(row.familyKey&&!holds.has(row.saintId)?[`family:${row.familyKey}`]:[]),`saint:${row.saintId}`,...row.sources.map(s=>`source:${s.id}`)]){
  const previous=keys.get(key);if(previous)join(previous,row.id);else keys.set(key,row.id);
 }
 const connected=new Map<string,PlannerRow[]>();
 for(const row of orderedRows){const key=root(row.id);connected.set(key,[...(connected.get(key)??[]),row]);}
 const loads=new Map<string,PlannerRow[]>();
 const traditions=new Map<string,Set<string>>();
 for(const row of data.rows.filter(r=>r.status!=="Proposed"))loads.set(row.vitrine,[...(loads.get(row.vitrine)??[]),row]);
 const groups=[...connected.values()].sort((a,b)=>b.length-a.length||a[0].id.localeCompare(b[0].id));
 for(const rows of groups){
  const contextHold=rows.find(r=>holds.has(r.saintId));
  if(contextHold){plan.held.push({names:rows.map(r=>r.name),reason:holds.get(contextHold.saintId)!});continue;}
  if(rows.some(r=>["Needs Research","Needs section proposal"].includes(r.section))){
   plan.held.push({names:rows.map(r=>r.name),reason:"Section context needs review before a destination can be suggested."});continue;
  }
  if(rows.some(r=>r.status!=="Proposed"||isFlexible(r)||r.arrangementNeedsReview||r.lastConfirmed)){
   plan.held.push({names:rows.map(r=>r.name),reason:"Existing destination, flexible plan, or physical confirmation kept for the whole connected group."});continue;
  }
  const sections=[...new Set(rows.map(r=>r.section))];
  const candidates=(available.get(sections[0])??[]).filter(v=>v!=="0"&&sections.every(s=>available.get(s)?.includes(v)));
  if(!candidates.length){plan.held.push({names:rows.map(r=>r.name),reason:"No shared suggested area for this group. Choose a destination together."});continue;}
  const affiliations=[...new Set(rows.flatMap(r=>(r.traditionIds??[]).filter(id=>guide.affinities?.some(a=>a.section===r.section&&a.traditionId===id)).map(id=>`${r.section}:${id}`)))];
  const demand=summarizeRelicPackaging(rows.flatMap(r=>r.sources));
  function score(v:string){
   const current=loads.get(v)??[],count=summarizeRelicPackaging(current.flatMap(r=>r.sources));
   return {frames:count.reportedFrameEntries+count.reviewEntries,entries:Math.max(count.sourceEntries,current.length),affinity:affiliations.filter(id=>traditions.get(id)?.has(v)).length,upper:current.filter(r=>r.tier==="Featured"||r.tier==="Secondary").length};
  }
  const vitrine=[...candidates].sort((a,b)=>{
   const x=score(a),y=score(b);
   // Affiliation is only a small tie preference, never permission to fill one case with a whole tradition.
   return (demand.reportedFrameEntries||demand.reviewEntries?x.frames-y.frames:0)||
    (x.entries-Math.min(2,x.affinity))-(y.entries-Math.min(2,y.affinity))||
    x.upper-y.upper||candidates.indexOf(a)-candidates.indexOf(b);
  })[0];
  loads.set(vitrine,[...(loads.get(vitrine)??[]),...rows]);
  for(const id of affiliations){const locations=traditions.get(id)??new Set<string>();locations.add(vitrine);traditions.set(id,locations);}
  const counts=summarizeRelicPackaging(rows.flatMap(r=>r.sources));
  plan.groups.push({names:rows.map(r=>r.name),vitrine,sections,upper:rows.filter(r=>r.tier==="Featured"||r.tier==="Secondary").length,frames:counts.reportedFrameEntries,entries:counts.sourceEntries});
  plan.assignments.push(...rows.map(r=>({id:r.id,vitrine})));
 }
 return plan;
}
