import {db} from "@/lib/db";
import type {Prisma} from "@/lib/generated/prisma/client";
import {readVrindavanSectionProposalAudit} from "./vrindavan-section-proposals";
import {vrindavanSectionView} from "./vrindavan-section-view";
import {readMuseumData} from "./museum-working-data";
import {buildVrindavanWorkingView} from "./vrindavan-working-domain";
// PRIVATE: caller requires access_museum and view_full_saint_catalog.
export async function readVrindavanWorkingData(client:Prisma.TransactionClient=db) {
 const [audit,spn,overrides,arrangements]=await Promise.all([readVrindavanSectionProposalAudit({},client),readMuseumData(client),client.museumCuratorProposal.findMany({where:{museumId:"museum-vrindavan"}}),client.museumArrangement.findMany({where:{museumId:"museum-vrindavan"}})]);
 const initial=vrindavanSectionView(audit);
 const labels=new Map(spn.sections.flatMap(s=>s.families.map(f=>[f.key,f.label] as const)));
 for(const row of initial.placements) {
  const candidates=spn.placements.filter(p=>p.saintId===row.saintId);const groups=[...new Set(candidates.map(p=>p.curatorialFamily||p.familyId).filter(Boolean))];
  if(groups.length===1){row.familyId="suggested:"+groups[0];row.groupLabel=labels.get(groups[0])||candidates.find(p=>(p.curatorialFamily||p.familyId)===groups[0])?.groupLabel||candidates.find(p=>(p.curatorialFamily||p.familyId)===groups[0])?.curatorialFamily||groups[0];}
  row.adminSaintSlug=candidates.find(p=>p.adminSaintSlug)?.adminSaintSlug;
 }
 const working=buildVrindavanWorkingView(initial.placements,overrides,arrangements,audit.snapshotHash);
 const sections=[...audit.sectionCatalogue,{name:"Needs section proposal",slug:"needs-section-proposal"}].map(s=>({...s,count:working.placements.filter(p=>p.section===s.name).length}));
 return {...working,sections,audit};
}
