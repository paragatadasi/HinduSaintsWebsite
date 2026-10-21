import {z} from "zod";
import {classifyRelicPackaging} from "./museum-relic-packaging";
import {vitrineNumber,type PlannerRow} from "./museum-move-planner-domain";
const vitrine=z.string().regex(/^(?:[0-9]|1[0-9]|2[0-4])$/);
export const variantRowSchema=z.object({id:z.string(),saintId:z.string(),section:z.string(),proposalRevision:z.string(),vitrine:vitrine.nullable(),shelf:z.string().max(100),flexibleVitrines:z.array(vitrine),note:z.string().max(2000).optional(),order:z.number().int().positive().optional()});
export const variantSchema=z.object({id:z.string(),name:z.string().trim().min(1).max(100),createdAt:z.string(),updatedAt:z.string(),scope:z.enum(["full","targeted"]).default("full"),sourceFingerprint:z.string().optional(),description:z.string().max(4000).default(""),steps:z.array(z.object({order:z.number().int().positive(),title:z.string().max(200),saintIds:z.array(z.string()),instruction:z.string().max(4000)})).default([]),taskSaintIds:z.array(z.string()).default([]),rows:z.array(variantRowSchema).max(2000),areas:z.array(z.object({section:z.string(),vitrines:z.array(vitrine)})).max(200)});
export const registrySchema=z.object({version:z.literal(1),activeId:z.string(),variants:z.array(variantSchema).max(30)});
export type MuseumPlanVariant=z.infer<typeof variantSchema>;
export type MuseumPlanVariants=z.infer<typeof registrySchema>&{revision:string;initialized:boolean};
export const variantControl=z.object({revision:z.string().regex(/^[a-f0-9]{64}$/),planRevision:z.string().regex(/^[a-f0-9]{64}$/)});
export const variantSaveInput=variantControl.extend({name:z.string().trim().min(1).max(100)});
export const variantSelectInput=variantControl.extend({id:z.string().min(1).max(200)});
export type VariantCurrentRow={id:string;saintId:string;section:string;proposalRevision:string;status:string;vitrine:string;shelf:string;flexibleVitrines?:string[]};
/** Identity and proposal edits invalidate a saved destination; physical confirmations are never replayed. */
export function compareVariant(variant:MuseumPlanVariant,current:VariantCurrentRow[]){
 const map=new Map(current.map(row=>[row.id,row]));const changes:{id:string;from:string;to:string}[]=[];const preservedImplemented:string[]=[];const replannedImplemented:string[]=[];
 for(const saved of variant.rows){
  const row=map.get(saved.id);
  if(!row||row.saintId!==saved.saintId||row.section!==saved.section||row.proposalRevision!==saved.proposalRevision)throw new Error("Saint identities or section proposals changed since this proposal was saved. Review it before switching.");
  if(row.status==="Implemented"){if(!saved.vitrine||(saved.vitrine===row.vitrine&&saved.shelf===row.shelf)){preservedImplemented.push(row.id);continue;}replannedImplemented.push(row.id);}
  if((row.vitrine||null)!==saved.vitrine||row.shelf!==saved.shelf||JSON.stringify([...(row.flexibleVitrines??[])].sort())!==JSON.stringify([...saved.flexibleVitrines].sort()))changes.push({id:row.id,from:[row.vitrine,row.shelf].filter(Boolean).join(" · ")||"Unassigned",to:[saved.vitrine,saved.shelf].filter(Boolean).join(" · ")||(saved.flexibleVitrines.length?`Flexible: ${saved.flexibleVitrines.join(", ")}`:variant.scope==="targeted"?"Stay in current location":"No destination")});
 }
 if(current.some(row=>!variant.rows.some(saved=>saved.id===row.id)))throw new Error("New saints were added since this proposal was saved. Review it before switching.");
 return {changed:changes.length,unchanged:current.length-changes.length-preservedImplemented.length,preservedImplemented:preservedImplemented.length,replannedImplemented:replannedImplemented.length,changes};
}

/** Relic-housing balance only; source packaging does not establish portrait presence or picture-space capacity. */
export function validateTargetedMoveCapacity(rows:PlannerRow[],entries:{saintId:string;vitrine:string}[]){
 const selected=new Map(entries.map(entry=>[entry.saintId,entry]));const frameBalance=new Map<string,{incoming:number;outgoing:number}>();
 const balance=(vitrine:string)=>{const value=frameBalance.get(vitrine)??{incoming:0,outgoing:0};frameBalance.set(vitrine,value);return value;};
 for(const entry of entries){
  const row=rows.find(row=>row.saintId===entry.saintId);if(!row||!row.sources.length)throw new Error("Every targeted move needs current source-location and container evidence.");
  const locations=new Set(row.sources.map(source=>vitrineNumber(source.vitrine)));
  if(locations.has(null)||locations.size!==1)throw new Error("A saint with unknown or multiple source vitrines needs a separately reviewed item-level plan.");
  for(const source of row.sources){if(source.shared){const owners=rows.filter(candidate=>candidate.sources.some(item=>item.id===source.id));if(owners.length<2||owners.some(owner=>selected.get(owner.saintId)?.vitrine!==entry.vitrine))throw new Error("Shared source entries must move together to one destination; partial shared-entry moves need review.");}}
  const packaging=row.sources.map(source=>source.packaging??classifyRelicPackaging(source.packagingText));
  if(packaging.some(evidence=>evidence.reviewRequired||["unknown","conflicting"].includes(evidence.type)))throw new Error("Unknown or conflicting relic-housing evidence needs review before a targeted move can be loaded.");
  const from=row.lastConfirmed?vitrineNumber(row.lastConfirmed.vitrine):[...locations][0];if(!from)throw new Error("The confirmed starting vitrine needs review.");
  if(from===entry.vitrine)continue;
  if(packaging.some(evidence=>["frame","small_frame","mixed_frame"].includes(evidence.type))){balance(from).outgoing++;balance(entry.vitrine).incoming++;}
 }
 for(const [vitrine,value] of frameBalance)if(value.incoming>value.outgoing)throw new Error(`Vitrine ${vitrine} receives ${value.incoming} frame-housed relic entries but only ${value.outgoing} leave. Pair each incoming frame-housed relic entry with an outgoing frame-housed relic entry.`);
 return [...frameBalance].map(([vitrine,value])=>({vitrine,...value}));
}
