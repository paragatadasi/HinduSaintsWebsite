import {classifyRelicPackaging,type RelicPackagingSource} from "./museum-relic-packaging";

export const PACKAGING_COMPONENTS=["frame","small_frame","box","bag","urn","paduka"] as const;
export type PackagingComponent=typeof PACKAGING_COMPONENTS[number];
const labels:Record<string,PackagingComponent>={frame:"frame","small frame":"small_frame",box:"box",bag:"bag",urn:"urn",paduka:"paduka"};

// Provisional source-reported components, never verified physical objects.
// Quantities count relic contents and must not multiply packaging components.
export function summarizePackagingComponents(sources:ReadonlyArray<RelicPackagingSource>){
 const unique=new Map<string,{signature:string;components:PackagingComponent[];unknown:boolean;conflict:boolean;discrepancy:boolean}>();
 for(const source of sources){
  const evidence=source.packaging??classifyRelicPackaging(source.packagingText);
  const parts=[...new Set(evidence.rawText.trim().toLowerCase().split(/\s*\/\s*/).map(part=>part.trim().replace(/\s+/g," ")).filter(Boolean))].sort();
  const components=parts.flatMap(part=>labels[part]?[labels[part]]:[]);
  const unknown=evidence.type==="unknown"||parts.some(part=>!labels[part]&&part!=="no picture")||!components.length;
  const signature=JSON.stringify({parts,type:evidence.type});
  const previous=unique.get(source.id);
  unique.set(source.id,{signature,components,unknown,conflict:evidence.type==="conflicting"||!!previous?.conflict||!!previous&&previous.signature!==signature,discrepancy:evidence.secondaryDisagrees||!!previous?.discrepancy});
 }
 const counts:Record<PackagingComponent,number>={frame:0,small_frame:0,box:0,bag:0,urn:0,paduka:0};
 let unknownEntries=0,conflictingEntries=0,mixedEntries=0,discrepancyEntries=0;
 for(const entry of unique.values()){
  if(entry.discrepancy)discrepancyEntries++;
  if(entry.conflict){conflictingEntries++;continue;}
  if(entry.unknown){unknownEntries++;continue;}
  if(entry.components.length>1)mixedEntries++;
  for(const component of entry.components)counts[component]++;
 }
 return {sourceEntries:unique.size,components:counts,mixedEntries,unknownEntries,conflictingEntries,discrepancyEntries,reviewEntries:unknownEntries+conflictingEntries};
}