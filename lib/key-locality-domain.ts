import {z} from "zod";
export const keyLocalityBundleSchema=z.object({
 schema_version:z.literal("1.0"),review_version:z.string().min(1),policy:z.record(z.unknown()),
 records:z.array(z.object({
  external_id:z.string().regex(/^hindu-saints:saint:[a-z0-9-]+$/),name:z.string().min(1),
  status:z.enum(["supported_shortlist","unresolved_no_recommendation"]),
  recommended_localities:z.array(z.object({display_order:z.number().int().min(1).max(3),locality_id:z.string(),locality:z.string().min(1),country:z.string().length(2),confidence:z.enum(["high","medium","low"]),precision:z.string(),lifetime_connection:z.boolean(),why_key:z.string(),source_refs:z.array(z.string())}).passthrough()).max(3),
  citations:z.array(z.object({source_id:z.string(),url:z.string().url().refine(url=>/^https?:\/\//i.test(url),"Research links must use HTTP or HTTPS"),title:z.string()}).passthrough()),
  ambiguity:z.string(),evidence_scope:z.string()
 }).passthrough()).max(2000)
}).passthrough().superRefine((bundle,ctx)=>{
 const ids=new Set<string>();
 for(const r of bundle.records){
  if(ids.has(r.external_id))ctx.addIssue({code:"custom",message:"Duplicate research identity"});ids.add(r.external_id);
  if(r.recommended_localities.some((l,i)=>l.display_order!==i+1||l.source_refs.some(ref=>!r.citations.some(c=>c.source_id===ref))))ctx.addIssue({code:"custom",message:"Invalid ordering or source reference"});
  if((r.status==="supported_shortlist")!==(r.recommended_localities.length>0))ctx.addIssue({code:"custom",message:"Inconsistent research status"});
 }
});
export type KeyLocalityRecord=z.infer<typeof keyLocalityBundleSchema>["records"][number];
export const countryName=(code:string)=>new Intl.DisplayNames(["en"],{type:"region"}).of(code.toUpperCase())||code;
export const normalizedCountry=(value:string|null)=>{const v=value?.trim().toLowerCase();if(!v)return "";for(const code of ["IN","BD","US","NP","LK","NL","CH","PK","FR","ZA","GB","GH","IT"])if(v===code.toLowerCase()||v===countryName(code).toLowerCase())return code;return v;};
export function usableKeyLocalities(record:KeyLocalityRecord){return record.recommended_localities.filter(l=>l.lifetime_connection&&l.precision.startsWith("named locality")&&l.source_refs.length>0);}
// A representative shortlist is not a chronological route. Legacy associations remain stored.
export function mainLocalities<T extends {keyLocalityOrder?:number|null}>(places:T[]):T[]{
 const ranked=places.filter(p=>p.keyLocalityOrder!=null).sort((a,b)=>a.keyLocalityOrder!-b.keyLocalityOrder!);
 return ranked.length?ranked.slice(0,3):places;
}
