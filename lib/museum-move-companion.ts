import {isFlexible,vitrineNumber,type PlannerRow} from "./museum-move-planner-domain";
import {VRINDAVAN_SUBSECTION_PARENTS,LINEAGE_REGIONS,LINEAGE_SUPPLEMENT} from "./vrindavan-lineage-catalogue";
export function moveRegion(section:string){return VRINDAVAN_SUBSECTION_PARENTS[section]||(LINEAGE_REGIONS.some(r=>r.name===section)||section===LINEAGE_SUPPLEMENT.name?section:"Other / needs review");}
export function startingVitrines(row:PlannerRow){return [...new Set(row.lastConfirmed?[row.lastConfirmed.vitrine]:row.sources.map(source=>source.vitrine).filter(Boolean))];}
export function destinationVitrines(row:PlannerRow){return isFlexible(row)?row.flexibleVitrines!:row.status!=="Proposed"&&row.vitrine?[row.vitrine]:[];}
export type MoveFilters={query:string;source:string;destination:string;region:string;section:string;status:string;sort:string};
function matchesVitrine(values:string[],filter:string){return !filter||(filter==="unknown"?!values.length:values.some(v=>(vitrineNumber(v)||v)===filter));}
export function filterMoveRows(rows:PlannerRow[],filters:MoveFilters){return rows.filter(row=>{
 const status=filters.status==="all"||filters.status==="remaining"&&(row.status!=="Implemented"||row.arrangementNeedsReview)||filters.status==="implemented"&&row.status==="Implemented"&&!row.arrangementNeedsReview||filters.status==="review"&&row.arrangementNeedsReview||filters.status==="flexible"&&isFlexible(row)||filters.status==="unassigned"&&row.status==="Proposed"&&!isFlexible(row)||filters.status==="planned"&&row.status==="Planned";
 return status&&matchesVitrine(startingVitrines(row),filters.source)&&matchesVitrine(destinationVitrines(row),filters.destination)&&(!filters.region||moveRegion(row.section)===filters.region)&&(!filters.section||row.section===filters.section)&&filters.query.trim().toLocaleLowerCase().split(/\s+/).every(term=>row.name.toLocaleLowerCase().includes(term));
 }).sort((a,b)=>{
 const key=(r:PlannerRow)=>filters.sort==="source"?startingVitrines(r).map(v=>vitrineNumber(v)||v).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))[0]||"~":filters.sort==="destination"?[...destinationVitrines(r)].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))[0]||"~":filters.sort==="section"?r.section:r.name;
 return key(a).localeCompare(key(b),undefined,{numeric:true})||a.name.localeCompare(b.name);
 });}

