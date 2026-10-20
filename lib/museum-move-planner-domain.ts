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
export const plannerCompletionInput=z.object({
 placementId:z.string().min(1).max(200),revision:z.string().regex(/^[a-f0-9]{64}$/),
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
 revision:string;lastConfirmed:PlannerConfirmation|null;
 sources:{id:string;vitrine:string;shelf:string;relics:string;quantity:string;shared:boolean}[];
};
export type PlannerData={
 revision:string;photoVitrines:string[];photosConfigured:boolean;photoUpdatedAt:string|null;
 rows:PlannerRow[];sections:{name:string;slug:string;idea:string}[];
 awaitingIdentityReview:number;unmappedLocations:string[];
};
export function photoSaintsInVitrines(entries:Pick<MuseumSourceInventoryEntry,"displayText"|"saintIds">[],vitrines:string[]) {
 const selected=new Set(vitrines);
 return [...new Set(entries.filter(e=>selected.has(vitrineNumber(e.displayText)??"")).flatMap(e=>e.saintIds))].sort();
}
export function plannerCounts(rows:PlannerRow[]){
 const unique=[...new Map(rows.map(row=>[row.saintId,row])).values()];
 return {total:unique.length,photo:unique.filter(row=>row.photo).length,
  untagged:unique.filter(row=>!row.photo).length,unplanned:unique.filter(row=>row.status==="Proposed").length,
  planned:unique.filter(row=>row.status==="Planned").length,implemented:unique.filter(row=>row.status==="Implemented").length};
}
