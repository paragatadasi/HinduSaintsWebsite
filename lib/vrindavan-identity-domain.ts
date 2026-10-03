import { z } from "zod";
export const VRINDAVAN_MAPPING = "vrindavan-identity-v1";
const cell = z.union([z.string().max(20000),z.number().finite(),z.boolean(),z.null()]);
export const vrindavanBundleSchema = z.object({
  version:z.literal(1), museum:z.literal("vrindavan"), sourceName:z.string().trim().min(1).max(200),
  sha256:z.string().regex(/^[a-f0-9]{64}$/),
  sheets:z.array(z.object({name:z.enum(["Sheet1","DuplicatesMagenta"]),rows:z.array(z.object({row:z.number().int().min(1).max(10000),cells:z.array(cell).min(1).max(40)}).strict()).min(1).max(2000)}).strict()).min(1).max(2)
}).strict().superRefine((b,ctx)=>{
  if(new Set(b.sheets.map(s=>s.name)).size!==b.sheets.length||!b.sheets.some(s=>s.name==="Sheet1"))ctx.addIssue({code:"custom",message:"Choose the original inventory sheet once."});
  for(const s of b.sheets) if(new Set(s.rows.map(r=>r.row)).size!==s.rows.length)ctx.addIssue({code:"custom",message:"Duplicate source row."});
});
export type VrindavanBundle=z.infer<typeof vrindavanBundleSchema>;
export type WebsiteIdentity={id:string;displayName:string;canonicalName:string;slug:string;status:string;aliases:Array<{alias:string}>};
export function identityName(value:string){return value.normalize("NFKD").replace(/\p{M}/gu,"").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim().replace(/\s+/g," ");}
const core=(v:string)=>identityName(v).split(/\bof\b/)[0].trim();
const titles=new Set("sri shri shree srila sree ji jee 1008 108 maharaj maharaja maharaji maharajji swami swamiji babaji baba paramahamsa paramhansa srimad shrimad saint sant sadguru sadgurudev sadhguru guru acharya".split(" "));
const relaxed=(v:string)=>core(v).split(" ").filter(t=>!titles.has(t)).join(" ");
export type IdentityMatch={category:"clear"|"ambiguous"|"possible"|"unmatched"|"unidentified";method:string;candidates:WebsiteIdentity[]};
export function buildWebsiteIdentityMatcher(saints:WebsiteIdentity[]){
  const active=saints.filter(s=>s.status!=="archived");
  const indices=[new Map<string,Set<string>>(),new Map<string,Set<string>>(),new Map<string,Set<string>>()];
  const byId=new Map(active.map(s=>[s.id,s]));
  for(const s of active)for(const name of [s.displayName,s.canonicalName,...s.aliases.map(a=>a.alias)]){
    [identityName(name),core(name),relaxed(name)].forEach((key,i)=>{if(key){const ids=indices[i].get(key)||new Set<string>();ids.add(s.id);indices[i].set(key,ids);}});
  }
  return (name:string|null):IdentityMatch=>{
    if(!name||/^(frame pic no name)$/i.test(name.trim()))return {category:"unidentified",method:"No saint identity supplied",candidates:[]};
    const exact=indices[0].get(identityName(name))||new Set<string>();
    const sameName=indices[1].get(core(name))||new Set<string>();
    const similar=indices[2].get(relaxed(name))||new Set<string>();
    // Broader variants can reveal an imported duplicate even when an exact match exists.
    const ids=new Set([...exact,...sameName,...similar]);
    const candidates=[...ids].sort().map(id=>byId.get(id)!);
    if(/[&]/.test(name))return {category:"possible",method:"Source names multiple saints; review all identities",candidates};
    if(ids.size>1)return {category:"ambiguous",method:"Multiple website identities or possible duplicate drafts",candidates};
    if(ids.size===1&&(exact.size||sameName.size))return {category:"clear",method:exact.size?"Exact website name or alias":"Same name with location suffix",candidates};
    if(ids.size)return {category:"possible",method:"Title or alias variant; confirm identity",candidates};
    return {category:"unmatched",method:"No clear website name or alias match",candidates:[]};
  };
}
export type InventoryRow={sourceRow:number;name:string|null;place:string;relic:string;quantity:string;display:string;position:string;comments:string;raw:unknown;warnings:string[]};
const text=(v:unknown)=>v==null?"":String(v).trim();
export function inventoryRows(bundle:VrindavanBundle):InventoryRow[]{
  const main=bundle.sheets.find(s=>s.name==="Sheet1")!;
  const head=main.rows.find(r=>r.row===1)?.cells;
  if(head?.[0]!=="SAINT NAME"||head[2]!=="RELIC"||head[5]!=="Display/Vitrine")throw Error("Unexpected inventory columns");
  const secondary=new Map((bundle.sheets.find(s=>s.name==="DuplicatesMagenta")?.rows||[]).map(r=>[r.row,r.cells]));
  let section:unknown=null;
  return [...main.rows].sort((a,b)=>a.row-b.row).flatMap(r=>{
    const c=r.cells;const name=text(c[0]);
    if(r.row===1)return [];
    if(typeof c[0]==="number"||/^\d+\s*\(\d+\)$/.test(name)){section={row:r.row,cells:c};return [];}
    if(["Top Shelf 6&7 (relic in display 18?)","Not previously listed"].includes(name))return [];
    if(!name&&!text(c[2]))return [];
    const warnings:string[]=[];
    if(!name||name==="Frame Pic no name")warnings.push("Saint identity missing");
    if(!text(c[2]))warnings.push("Relic description missing");
    if(/moved|non match|non-match|non matching|name differ|⚠/i.test(c.map(text).join(" ")))warnings.push("Movement or identity discrepancy in source; physical placement needs review");
    if(name.includes("&"))warnings.push("Multiple saints in one source row");
    const other=secondary.get(r.row);
    if(other&&text(other[7])!==text(c[7]))warnings.push("Movement comments differ between the workbook sheets");
    return [{sourceRow:r.row,name:name||null,place:text(c[1]),relic:text(c[2]),quantity:text(c[3]),display:text(c[5]),position:text(c[6]),comments:text(c[7]),warnings,
      raw:{sourceName:bundle.sourceName,fileHash:bundle.sha256,sheet:"Sheet1",row:r.row,headers:head,cells:c,section,secondarySheet:other?{sheet:"DuplicatesMagenta",row:r.row,cells:other}:null}}];
  });
}
export const identityObservationSchema=z.object({mappingVersion:z.literal(VRINDAVAN_MAPPING),sourceName:z.string(),sourceRow:z.number(),name:z.string().nullable(),place:z.string(),relic:z.string(),quantity:z.string(),display:z.string(),position:z.string(),comments:z.string(),warnings:z.array(z.string()),saintIds:z.array(z.string()),note:z.string().nullable()});
export const identityDecisionSchema=z.object({id:z.string().min(1).max(100),version:z.string().regex(/^[a-f0-9]{64}$/),action:z.enum(["link","defer"]),saintIds:z.array(z.string().min(1).max(100)).max(20),note:z.string().trim().max(2000),confirm:z.boolean()}).superRefine((d,ctx)=>{
  if(d.action==="link"&&(!d.confirm||!d.saintIds.length||new Set(d.saintIds).size!==d.saintIds.length))ctx.addIssue({code:"custom",message:"Confirm distinct existing saints"});
  if(d.action==="defer"&&!d.note)ctx.addIssue({code:"custom",message:"Explain the follow-up needed"});
});
