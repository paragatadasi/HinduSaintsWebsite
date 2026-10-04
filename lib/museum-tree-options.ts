import type {MuseumSection} from "./museum-proposals";
export type MuseumTreeOption={key:string;label:string;seeds:string[];count:number;familyKey?:string};
export function museumTreeOptions(section:MuseumSection) {
 const sectionIds=new Set(section.rows.filter(r=>r.section===section.name).map(r=>r.id));
 const families=section.families.map(f=>({...f,rows:f.rows.filter(r=>sectionIds.has(r.id))})).filter(f=>f.rows.length>1);
 const option=(f:typeof families[number]):MuseumTreeOption=>({key:f.key,familyKey:f.key,label:f.label,seeds:[...new Set(f.rows.flatMap(r=>r.saintId?[r.saintId]:[]))],count:f.rows.length});
 const hasReferences=families.some(f=>f.treeFile);
 const main=families.filter(f=>hasReferences?Boolean(f.treeFile):f.rows.length>1);
 const keys=new Set(main.map(f=>f.key));
 return {main:main.map(option),additional:families.filter(f=>!keys.has(f.key)).map(option)};
}
