import {createHash} from "node:crypto";
import {z} from "zod";
import type {MuseumSaintPlacement} from "./museum-proposals";
export type ArrangementStatus="Proposed"|"Planned"|"Implemented";
export type ArrangementControl={status:ArrangementStatus;revision:string;proposalRevision:string;familyKey:string;vitrine:string;shelf:string;confirmedAt:string|null;inventoryAcknowledged:boolean};
export type SavedArrangement={proposalRevision:string;status:string;version:number;vitrine:string|null;shelf:string|null;confirmedAt:Date|null;inventoryAcknowledged:boolean};
const digest=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function arrangementControl(row:MuseumSaintPlacement,saved:SavedArrangement|undefined,context:unknown):ArrangementControl {
 const proposalRevision=digest({id:row.id,saintId:row.saintId,section:row.section,tier:row.tier,familyId:row.familyId,curatorialFamily:row.curatorialFamily,context});
 const current=saved?.proposalRevision===proposalRevision;
 return {proposalRevision,revision:digest({proposalRevision,version:saved?.version||0}),familyKey:row.displayMembership?.familyKey||row.curatorialFamily||row.familyId||"",
 status:current&&["Planned","Implemented"].includes(saved.status)?saved.status as ArrangementStatus:"Proposed",
 vitrine:current?saved.vitrine||"":"",shelf:current?saved.shelf||"":"",confirmedAt:current?saved.confirmedAt?.toISOString()||null:null,inventoryAcknowledged:current&&saved.inventoryAcknowledged};
}
export const arrangementInput=z.object({placementId:z.string().min(1).max(200),revision:z.string().regex(/^[a-f0-9]{64}$/),familyKey:z.string().max(200),status:z.enum(["Proposed","Planned","Implemented"]),vitrine:z.string().trim().max(100).default(""),shelf:z.string().trim().max(100).default(""),physicalConfirmation:z.literal("yes").optional(),inventoryAcknowledged:z.literal("yes").optional()}).superRefine((v,c)=>{
 if(v.status==="Planned"&&!v.vitrine)c.addIssue({code:"custom",path:["vitrine"],message:"Choose a destination vitrine before marking this arrangement Planned. Shelf is optional."});
 if(v.shelf&&!v.vitrine)c.addIssue({code:"custom",path:["shelf"],message:"Enter the vitrine for this shelf."});
 if(v.status==="Implemented"&&(v.physicalConfirmation!=="yes"||v.inventoryAcknowledged!=="yes"))c.addIssue({code:"custom",path:["physicalConfirmation"],message:"Confirm the physical arrangement and acknowledge that inventory completeness has not been verified."});
});
