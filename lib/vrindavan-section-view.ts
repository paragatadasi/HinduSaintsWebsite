import type {readVrindavanSectionProposalAudit} from "./vrindavan-section-proposals";
import type {MuseumSaintPlacement} from "./museum-proposals";
type Audit=Awaited<ReturnType<typeof readVrindavanSectionProposalAudit>>;
// Reviewed user decisions, keyed to confirmed canonical identities. Keep explicit
// until the audited correction batch is applied; never infer a move from source geography.
const gaudiyaDecisions=new Set(["cmq4hd38u00j6dp045lim8o3r","cmq4hd4fj00rhdp04eehy5l4a"]);
export function vrindavanSectionView(audit:Pick<Audit,"rows"|"sectionCatalogue">) {
 const sections=[...audit.sectionCatalogue,{name:"Needs section proposal",slug:"needs-section-proposal"}];
 const placements:MuseumSaintPlacement[]=audit.rows.flatMap(saint=>{
  const reviewed=gaudiyaDecisions.has(saint.saintId);
  const proposals=reviewed?[{...(saint.proposals[0]||{tier:"Secondary" as const,confidence:"Medium",rationale:"",alternatives:[]}),section:"Gaudiya Vaishnava"}]:saint.proposals;
  return (proposals.length?proposals:[{section:"Needs section proposal",tier:"Tertiary" as const,confidence:"Low",rationale:"No section proposal is available yet.",alternatives:[]}]).map((p,i)=>({
   id:`vrindavan:${saint.saintId}:${i}`,saintId:saint.saintId,name:saint.name,section:p.section,tier:p.tier,confidence:p.confidence,alternatives:p.alternatives.filter(s=>s!==p.section),rationale:reviewed?"Reviewed curator decision: Gaudiya lineage takes precedence over geographic suggestions.":p.rationale,
   note:(reviewed?"Reviewed section correction; inherited SPN geography may still await correction. ":"Starting proposal adapted from SPN; not a confirmed Vrindavan arrangement. ")+"Source inventory rows: "+saint.sourceRows.join(", ")+". Source place text is evidence to review, not a section assignment.",
   placementState:"Proposed" as const,familyId:"",curatorialFamily:"",familySize:0,spiritualRegions:saint.spiritualRegions.map(p=>p.name),sampradaya:"",normalizedPlaces:saint.primaryPlaces.map(p=>[p.name,p.region,p.country].filter(Boolean).join(", ")),needsResearch:(!reviewed&&saint.needsSectionReview)||saint.placeComparisons.some(p=>p.needsResearch)
  }));
 });
 return {placements,sections:sections.filter(s=>placements.some(p=>p.section===s.name)).map(s=>({...s,count:placements.filter(p=>p.section===s.name).length}))};
}
