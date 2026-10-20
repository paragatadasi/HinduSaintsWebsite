import {createHash} from "node:crypto";
import plan from "../data/museum/vrindavan-lineage-first-plan.json";
import {LINEAGE_VERSION,LINEAGE_QUEUE,LINEAGE_REGIONS,LINEAGE_SUPPLEMENT,isLineageTarget} from "./vrindavan-lineage-catalogue";
export {LINEAGE_VERSION,LINEAGE_QUEUE,LINEAGE_REGIONS,LINEAGE_SUPPLEMENT,isLineageTarget};
export const LINEAGE_RULES=plan.family_anchor_rules;
export type LineageInput={saintId:string;name:string;section:string;tier:string;familyKey:string;familyLabel:string;subgroups:string[];alternatives:string[];curatorOverride:boolean;reviewedGeographySections?:string[]};
export type ReviewedFamilyAnchor={familyKey:string;ruleGroup:string;memberIds:string[];evidence:string};
export function subgroupRegion(name:string){
 if(isLineageTarget(name))return name;
 const match=plan.legacy_section_crosswalk.find(s=>s.legacy_section===name);
 if(match?.default_region_order)return LINEAGE_REGIONS[match.default_region_order-1]?.name??null;
 return match?.mapping_kind==="Supplementary context"?LINEAGE_SUPPLEMENT.name:null;
}
export function buildLineagePreview(rows:LineageInput[],anchors:ReviewedFamilyAnchor[]=[]) {
 if(new Set(rows.map(r=>r.saintId)).size!==rows.length)throw Error("Expected unique confirmed canonical saints");
 const results=rows.map(row=>{
  const choices=[...new Set((row.subgroups.length?row.subgroups:[row.section]).flatMap(s=>{const target=subgroupRegion(s);return target?[target]:[];}))];
  const geography=[...new Set((row.reviewedGeographySections||[]).map(subgroupRegion).filter((s):s is string=>Boolean(s)))];
  const proposed=choices.length===1?choices[0]:!choices.length&&!row.familyKey&&geography.length===1?geography[0]:null;
  return {...row,beforeSection:row.section,proposedSection:proposed,afterSection:row.section,
   classification:(row.curatorOverride?"protected":choices.length>1?"conflicting":!proposed?"unassigned":proposed===row.section?"unchanged":"changed") as "changed"|"unchanged"|"protected"|"conflicting"|"unassigned",
   basis:choices.length===1?"Existing subgroup regional default":!choices.length&&geography.length===1?"Reviewed key locality for ungrouped saint":"Unresolved subgroup/region",anchorRule:null as string|null,
   mappedAlternatives:[...new Set(row.alternatives.flatMap(s=>{const mapped=subgroupRegion(s);return mapped?[mapped]:[];}))],reviewNotes:[] as string[]};
 });
 const families=[...new Set(rows.map(r=>r.familyKey).filter(Boolean))].map(key=>{
  const members=results.filter(r=>r.familyKey===key);const memberIds=members.map(r=>r.saintId).sort();
  const matches=anchors.filter(a=>a.familyKey===key);let conflict=matches.length>1;
  const anchor=matches[0],rule=anchor?LINEAGE_RULES.find(r=>r.group===anchor.ruleGroup):null;
  if(anchor&&(!rule||!anchor.evidence.trim()||JSON.stringify([...new Set(anchor.memberIds)].sort())!==JSON.stringify(memberIds)))conflict=true;
  if(anchor&&rule&&!conflict)for(const row of members){row.proposedSection=rule.default_section;row.basis="Reviewed display-family anchor";row.anchorRule=rule.group;}
  const choices=[...new Set(members.flatMap(r=>r.proposedSection?[r.proposedSection]:[]))];
  if(choices.length!==1||members.some(r=>!r.proposedSection))conflict=true;
  // Never split the visible family by moving only its unprotected members.
  if(members.some(r=>r.curatorOverride&&r.section!==choices[0]))conflict=true;
  if(conflict)for(const row of members){row.classification=row.curatorOverride?"protected":"conflicting";row.reviewNotes.push("Family retained together for review; no automatic partial family move.");}
  return {key,label:members[0].familyLabel,memberIds,proposedSection:choices.length===1?choices[0]:null,conflicting:conflict,anchorRule:rule?.group??null};
 });
 for(const row of results){
  if(!["protected","conflicting"].includes(row.classification)&&row.proposedSection){row.afterSection=row.proposedSection;row.classification=row.afterSection===row.beforeSection?"unchanged":"changed";}
  if(row.curatorOverride)row.reviewNotes.push("Explicit curator decision and membership preserved; this operation does not rewrite it.");
 }
 const counts={changed:0,unchanged:0,protected:0,conflicting:0,unassigned:0};for(const r of results)counts[r.classification]++;
 return {version:LINEAGE_VERSION,rows:results,families,counts,conflictingFamilies:families.filter(f=>f.conflicting).length,
  catalogue:[...LINEAGE_REGIONS,...(results.some(r=>r.afterSection===LINEAGE_SUPPLEMENT.name)?[LINEAGE_SUPPLEMENT]:[]),{name:LINEAGE_QUEUE,slug:"needs-section-proposal"}],
  revision:createHash("sha256").update(JSON.stringify({version:LINEAGE_VERSION,rows,anchors})).digest("hex")};
}
