import {createHash} from "node:crypto";
import type {MuseumSaintPlacement} from "./museum-proposals";
import {arrangementControl,familyArrangementControl,type SavedArrangement} from "./museum-arrangement-domain";
export type CuratorOverride={saintId:string;section:string;tier:string;groupKey:string;groupLabel:string;version:number};
const hash=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function buildVrindavanWorkingView(base:MuseumSaintPlacement[],overrides:CuratorOverride[],saved:(SavedArrangement&{placementId:string})[],snapshot:string|null) {
 const ids=[...new Set(base.flatMap(p=>p.saintId?[p.saintId]:[]))];
 const placements=ids.map(saintId=>{
  const candidates=base.filter(p=>p.saintId===saintId);const inherited=candidates[0];const override=overrides.find(p=>p.saintId===saintId);
  const conflicting=candidates.length!==1;
  const row:MuseumSaintPlacement={...inherited,id:`vrindavan:${saintId}`,section:conflicting?"Needs section proposal":inherited.section,
   alternatives:conflicting?candidates.map(p=>p.section):inherited.alternatives,needsResearch:inherited.needsResearch||conflicting,
   ...(override?{section:override.section,tier:override.tier as MuseumSaintPlacement["tier"],familyId:override.groupKey,curatorialFamily:"",groupLabel:override.groupLabel,note:"Curator-edited Vrindavan proposal. "+inherited.note}:{}),
  };
  row.curatorProposalRevision=hash({saintId,snapshot,overrideVersion:override?.version||0,inventoryEvidence:candidates.map(p=>p.note),base:override?null:candidates.map(p=>[p.section,p.tier,p.familyId,p.groupLabel])});
  row.arrangement=arrangementControl(row,saved.find(p=>p.placementId===row.id),row.curatorProposalRevision);
  return row;
 });
 const groupOptions=[...new Map([...base,...placements].filter(p=>p.familyId).map(p=>[p.familyId,{key:p.familyId,label:p.groupLabel||p.curatorialFamily||p.familyId}])).values()];
 const families=groupOptions.flatMap(group=>{
  const rows=placements.filter(p=>p.familyId===group.key);if(!rows.length)return [];
  return [{...group,count:rows.length,revision:hash(rows.map(r=>[r.id,r.curatorProposalRevision]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])))),arrangement:familyArrangementControl(rows)}];
 });
 return {placements,groupOptions,families};
}
