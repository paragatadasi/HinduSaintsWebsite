import {museumFlowZones} from "./museum-layout-groups";
import {vrindavanRegionGroups,VRINDAVAN_SUBSECTION_PARENTS,LINEAGE_SUPPLEMENT} from "./vrindavan-lineage-catalogue";
export type MuseumNavSection={name:string;slug:string;total:number};
export type MuseumNavLink={label:string;href:string;count?:number};
export function museumSectionNavigation(sections:MuseumNavSection[],museum:"spn"|"vrindavan") {
 const link=(s:MuseumNavSection):MuseumNavLink=>({label:s.name,count:s.total,href:museum==="spn"?`/museumadmin/${s.slug}`:`/vrindavanadmin/sections?section=${encodeURIComponent(s.slug)}`});
 if(museum==="vrindavan"){
  const roots=vrindavanRegionGroups(sections).map(r=>({...r,total:sections.filter(s=>r.sections.includes(s.name)).reduce((sum,s)=>sum+s.total,0),links:sections.filter(s=>r.sections.includes(s.name)).map(link)}));
  const grouped=new Set(roots.flatMap(r=>r.sections));
  const unresolved=sections.filter(s=>!grouped.has(s.name)&&VRINDAVAN_SUBSECTION_PARENTS[s.name]!==LINEAGE_SUPPLEMENT.name);
  if(unresolved.length)roots.push({title:"Needs review",eyebrow:"Unresolved proposals",badge:"R",summary:"",sections:unresolved.map(s=>s.name),total:unresolved.reduce((sum,s)=>sum+s.total,0),links:unresolved.map(link)});
  return roots;
 }
 const grouped=new Set<string>(museumFlowZones.flatMap(z=>[...z.sections]));
 const groups:{title:string;eyebrow:string;badge:string;total?:number;links:MuseumNavLink[]}[]=museumFlowZones.map((zone,index)=>({title:zone.title,eyebrow:zone.eyebrow,badge:String(index+1).padStart(2,"0"),links:zone.sections.flatMap(name=>{const section=sections.find(s=>s.name===name);return section?[link(section)]:[];})})).filter(g=>g.links.length);
 const others=sections.filter(s=>!grouped.has(s.name));
 if(others.length)groups.push({title:"Review queue",eyebrow:"Needs placement",badge:"R",links:others.map(link)});
 return groups;
}
export function museumNavIsActive(href:string,pathname:string,section:string|null) {
 const [path,query]=href.split("?");
 if(query)return pathname===path&&section===new URLSearchParams(query).get("section");
 if(path==="/vrindavanadmin/sections")return pathname===path&&!section;
 if(path==="/museumadmin"||path==="/vrindavanadmin"||path==="/")return pathname===path;
 return pathname===path||pathname.startsWith(path+"/");
}
