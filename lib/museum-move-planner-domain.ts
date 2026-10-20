import {vrindavanRegionGroups} from "./vrindavan-lineage-catalogue";
import {z} from "zod";
import type {MuseumSourceInventoryEntry} from "./museum-source-inventory-domain";

export const vrindavanVitrines=Array.from({length:25},(_,i)=>String(i));
export function vitrineNumber(value:string):string|null {
 const match=/^(?:vitrine|display)?\s*#?\s*(\d{1,2})$/i.exec(value.trim());
 if(!match)return null;
 const number=String(Number(match[1]));
 return vrindavanVitrines.includes(number)?number:null;
}
export const plannerVitrine=z.string().refine(value=>vrindavanVitrines.includes(value),"Choose a vitrine on the room plan.");
export const plannerPhotoInput=z.object({
 revision:z.string().regex(/^[a-f0-9]{64}$/),
 vitrines:z.array(plannerVitrine).max(25)
});
export const plannerAssignmentInput=z.object({
 revision:z.string().regex(/^[a-f0-9]{64}$/),
 placementIds:z.array(z.string().min(1).max(200)).min(1,"Select at least one saint.").max(1000),
 vitrine:plannerVitrine,
 shelf:z.string().trim().max(100).default(""),
 replaceExisting:z.boolean().default(false)
});
export const plannerAreaInput=z.object({
 revision:z.string().regex(/^[a-f0-9]{64}$/),section:z.string().min(1).max(300),
 vitrines:z.array(plannerVitrine).max(25),areaVersion:z.number().int().nonnegative()
});
export const plannerFlexibleInput=z.object({
 revision:z.string().regex(/^[a-f0-9]{64}$/),section:z.string().min(1).max(300),
 placementIds:z.array(z.string().min(1).max(200)).min(1).max(1000),
 remove:z.boolean().default(false)
});
export function flexibleRecords(value:unknown){
 const parsed=z.array(z.object({id:z.string(),revision:z.string()})).safeParse(value);
 return parsed.success?parsed.data:[];
}
export function flexibleDestinations(row:{id:string;section:string;status:string;revision:string},areas:PlannerArea[]):string[]{
 const area=areas.find(area=>area.section===row.section);
 return row.status==="Proposed"&&area?.placements.some(p=>p.id===row.id&&p.revision===row.revision)?area.vitrines:[];
}
export type PlannerArea={version?:number;section:string;vitrines:string[];placements:{id:string;revision:string}[]};
export const plannerCompletionInput=z.object({
 placementId:z.string().min(1).max(200),revision:z.string().regex(/^[a-f0-9]{64}$/),
 planRevision:z.string().regex(/^[a-f0-9]{64}$/).optional(),vitrine:plannerVitrine.optional(),
 checkedSourceIds:z.array(z.string().min(1).max(200)).max(1000),
 shelf:z.string().trim().max(100).default(""),note:z.string().trim().max(2000).default(""),
 physicalConfirmation:z.literal(true),inventoryAcknowledged:z.literal(true)
});
export type PlannerConfirmation={vitrine:string;shelf:string;confirmedAt:string;note?:string};
// Old audit events may omit a location. Never turn those into a location assertion.
export function plannerConfirmation(value:unknown):PlannerConfirmation|null{
 const parsed=z.object({museumId:z.literal("museum-vrindavan"),status:z.literal("Implemented"),
  vitrine:z.string().trim().min(1),shelf:z.string().nullable().optional(),confirmedAt:z.string().datetime(),note:z.string().optional()}).safeParse(value);
 return parsed.success?{vitrine:parsed.data.vitrine,shelf:parsed.data.shelf||"",confirmedAt:parsed.data.confirmedAt,...(parsed.data.note?{note:parsed.data.note}:{})}:null;
}
export type PlannerRow={
 id:string;saintId:string;name:string;section:string;family:string;tier:string;needsResearch:boolean;
 photo:boolean;status:"Proposed"|"Planned"|"Implemented";vitrine:string;shelf:string;
 arrangementNeedsReview?:boolean;revision:string;lastConfirmed:PlannerConfirmation|null;familyKey?:string;flexibleVitrines?:string[];
 sources:{id:string;vitrine:string;shelf:string;relics:string;quantity:string;shared:boolean}[];
};
export type PlannerData={
 revision:string;photoVitrines:string[];photosConfigured:boolean;photoUpdatedAt:string|null;
 areas:PlannerArea[];rows:PlannerRow[];sections:{name:string;slug:string;idea:string}[];
 awaitingIdentityReview:number;unmappedLocations:string[];
};
export function photoSaintsInVitrines(entries:Pick<MuseumSourceInventoryEntry,"displayText"|"saintIds">[],vitrines:string[]) {
 const selected=new Set(vitrines);
 return [...new Set(entries.filter(e=>selected.has(vitrineNumber(e.displayText)??"")).flatMap(e=>e.saintIds))].sort();
}
export function plannerCounts(rows:PlannerRow[]){
 const unique=[...new Map(rows.map(row=>[row.saintId,row])).values()];
 return {total:unique.length,photo:unique.filter(row=>row.photo).length,
  untagged:unique.filter(row=>!row.photo).length,unplanned:unique.filter(row=>row.status==="Proposed"&&!isFlexible(row)).length,
  planned:unique.filter(row=>row.status==="Planned").length,implemented:unique.filter(row=>row.status==="Implemented").length};
}

export function plannerFamilies(rows:PlannerRow[]){
 const groups=new Map<string,{key:string;name:string;rows:PlannerRow[]}>();
 for(const row of rows){
  const key=row.familyKey||`saint:${row.id}`;
  const group=groups.get(key)||{key,name:row.family||row.name,rows:[]};group.rows.push(row);groups.set(key,group);
 }
 return [...groups.values()].sort((a,b)=>b.rows.length-a.rows.length||a.name.localeCompare(b.name));
}
export function isFlexible(row:PlannerRow){return row.status==="Proposed"&&!!row.flexibleVitrines?.length;}

// Keep older area decisions discoverable after catalogue or proposal revisions.
export function plannerAreasNeedingReview(areas:PlannerArea[],rows:PlannerRow[]){
 const current=new Map(rows.map(row=>[row.id,row]));
 const sections=new Set(rows.map(row=>row.section));
 return areas.filter(area=>area.vitrines.length>0).flatMap(area=>{
  const inactiveSection=!sections.has(area.section);
  const affected=area.placements.flatMap(member=>{
   const row=current.get(member.id);
   // An explicit destination supersedes a flexible allocation intentionally.
   if(row&&row.status!=="Proposed")return [];
   if(row&&row.section===area.section&&row.revision===member.revision)return [];
   return [{id:member.id,name:row?.name??null,currentSection:row?.section??null}];
  });
  return inactiveSection||affected.length?[{...area,inactiveSection,affected}]:[];
 });
}

export function plannerMoveNeedsAttention(row:PlannerRow){return !!row.arrangementNeedsReview||row.status==="Planned"||isFlexible(row);}

export function plannerRegionGroups(sections:{name:string}[],rows:Pick<PlannerRow,"section">[]){
 const counts=new Map<string,number>();for(const row of rows)counts.set(row.section,(counts.get(row.section)??0)+1);
 const active=sections.filter(section=>counts.has(section.name)).map(section=>({...section,count:counts.get(section.name)!}));
 const groups=vrindavanRegionGroups(active).map(group=>({title:group.title,badge:group.badge,sections:group.sections})).filter(group=>group.sections.length);
 const grouped=new Set(groups.flatMap(group=>group.sections));
 const other=active.filter(section=>!grouped.has(section.name)).map(section=>section.name);
 if(other.length)groups.push({title:"Other proposals",badge:"",sections:other});
 return groups;
}
