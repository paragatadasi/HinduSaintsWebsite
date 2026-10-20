// Private museum inventory evidence. A source row is not a verified physical item.
export type RelicPackagingType="frame"|"small_frame"|"mixed_frame"|"unframed"|"unknown"|"conflicting";
export type RelicPackagingEvidence={type:RelicPackagingType;rawText:string;secondaryText:string|null;sourceColumn:"E";preferredSheet:"Sheet1";secondaryDisagrees:boolean;size:"small"|"unspecified"|"unknown";hasOtherContainers:boolean;containerKinds:string[];reviewRequired:boolean};
export type RelicPackagingSource={id:string;sourceRow?:number;packagingText?:string;quantityText?:string;packaging?:RelicPackagingEvidence};
function classify(text:string):Omit<RelicPackagingEvidence,"rawText"|"secondaryText"|"sourceColumn"|"preferredSheet"|"secondaryDisagrees"|"reviewRequired">{
 const parts=[...new Set(text.trim().toLowerCase().split(/\s*\/\s*/).map(v=>v.trim().replace(/\s+/g," ")).filter(Boolean))];
 const containers=parts.filter(p=>["box","bag","urn","paduka"].includes(p)).sort();
 const known=parts.length&&parts.every(p=>["frame","small frame","box","bag","urn","paduka","no picture"].includes(p));
 if(!known||(!containers.length&&!parts.some(p=>["frame","small frame"].includes(p))))return {type:"unknown",size:"unknown",hasOtherContainers:false,containerKinds:containers};
 const frame=parts.includes("frame"),small=parts.includes("small frame"),hasOtherContainers=containers.length>0;
 if(small&&!frame)return {type:"small_frame",size:"small",hasOtherContainers,containerKinds:containers};
 if(frame)return {type:hasOtherContainers||small?"mixed_frame":"frame",size:small?"unknown":"unspecified",hasOtherContainers,containerKinds:containers};
 return {type:"unframed",size:"unknown",hasOtherContainers,containerKinds:containers};
}
export function classifyRelicPackaging(raw:unknown,secondary?:unknown):RelicPackagingEvidence{
 const rawText=typeof raw==="string"?raw:raw==null?"":String(raw),secondaryText=secondary==null?null:String(secondary);
 const primary=classify(rawText),other=secondaryText?.trim()?classify(secondaryText):null;
 // Curator decision: Sheet1 is authoritative when comparison-sheet labels differ.
 // Preserve the discrepancy as provenance without overriding or blocking Sheet1.
 const secondaryDisagrees=other!==null&&JSON.stringify(primary)!==JSON.stringify(other);
 return {...primary,rawText,secondaryText,sourceColumn:"E",preferredSheet:"Sheet1",secondaryDisagrees,reviewRequired:primary.type==="unknown"};
}
export function summarizeRelicPackaging(sources:ReadonlyArray<RelicPackagingSource>){
 const unique=new Map<string,RelicPackagingEvidence>();
 for(const source of sources){
  const evidence=source.packaging??classifyRelicPackaging(source.packagingText);
  const previous=unique.get(source.id);
  if(previous&&JSON.stringify(previous)!==JSON.stringify(evidence))unique.set(source.id,{...evidence,type:"conflicting",size:"unknown",reviewRequired:true});
  else unique.set(source.id,evidence);
 }
 const entries=[...unique.values()],count=(type:RelicPackagingType)=>entries.filter(e=>e.type===type).length;
 const frameEntries=count("frame"),smallFrameEntries=count("small_frame"),mixedFrameEntries=count("mixed_frame"),unknownEntries=count("unknown"),conflictingEntries=count("conflicting");
 return {sourceEntries:entries.length,frameEntries,smallFrameEntries,mixedFrameEntries,unframedEntries:count("unframed"),unknownEntries,conflictingEntries,reportedFrameEntries:frameEntries+smallFrameEntries+mixedFrameEntries,reviewEntries:unknownEntries+conflictingEntries,discrepancyEntries:entries.filter(e=>e.secondaryDisagrees).length};
}
