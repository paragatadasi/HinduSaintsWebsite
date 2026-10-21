import type {MuseumSection} from "./museum-proposals";
export type MuseumTreeOption={key:string;label:string;seeds:string[];count:number;familyKey?:string;contextLabel?:string};
export function museumTreeOptions(section:MuseumSection) {
 const sectionIds=new Set(section.rows.filter(r=>r.section===section.name).map(r=>r.id));
 const families=section.families.map(f=>({...f,rows:f.rows.filter(r=>sectionIds.has(r.id))})).filter(f=>f.rows.length>1);
 const option=(f:typeof families[number]):MuseumTreeOption=>({key:f.key,familyKey:f.key,label:f.label,seeds:[...new Set(f.rows.flatMap(r=>r.saintId?[r.saintId]:[]))],count:f.rows.length});
 const hasReferences=families.some(f=>f.treeFile);
 const main=families.filter(f=>hasReferences?Boolean(f.treeFile):f.rows.length>1);
 const keys=new Set(main.map(f=>f.key));
 return {main:main.map(option),additional:families.filter(f=>!keys.has(f.key)).map(option)};
}

export type InventoryTreeContext={familyKey?:string;sourceId?:string};
// Exact reviewed saint IDs only. Keep distinct proposed families separate.
export function inventoryTreeContexts(rows:MuseumSection["rows"],saintIds:string[]):Record<string,InventoryTreeContext[]>{
 return Object.fromEntries([...new Set(saintIds)].map(id=>{
  const matches=rows.filter(row=>row.saintId===id);
  const contexts=new Map<string,InventoryTreeContext>();
  for(const row of matches){const familyKey=row.curatorialFamily||row.familyId||undefined;contexts.set(familyKey||"",{familyKey,sourceId:row.sourceRecordId});}
  return [id,contexts.size?[...contexts.values()]:[{}]];
 }));
}
