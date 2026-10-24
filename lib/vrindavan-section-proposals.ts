import {vrindavanSubsectionCatalogue} from "./vrindavan-approved-subsections";
import {db} from "@/lib/db";
import type {Prisma} from "@/lib/generated/prisma/client";
import {readVrindavanMuseumInventory} from "./vrindavan-museum-inventory";
import {readMuseumData} from "./museum-working-data";
import {compareMuseumSourcePlace} from "./museum-place-comparison";
import {museumSectionForLocality} from "./museum-locality-proposals";

// Private, read-only projection. Caller enforces access_museum and full saint catalogue.
// Spiritual regions and website saint IDs are shared; museum operational assignments are not.
export type VrindavanProposalSources = {
 inventory?: Promise<Awaited<ReturnType<typeof readVrindavanMuseumInventory>>>;
 spn?: Promise<Awaited<ReturnType<typeof readMuseumData>>>;
};

// Supplied sources belong to this call's client/snapshot; never retain them across requests or writes.
export async function readVrindavanSectionProposalAudit(options:{snapshotHash?:string}={},client:Prisma.TransactionClient=db,sources:VrindavanProposalSources={}) {
 const inventoryPromise=sources.inventory??readVrindavanMuseumInventory(options,client);
 const spnPromise=sources.spn??readMuseumData(client,{reconcileFamilies:false});
 const saintsPromise=inventoryPromise.then(inventory=>client.saint.findMany({where:{id:{in:inventory.saints.map(s=>s.id)},status:{not:"archived"}},select:{id:true,places:{include:{place:true}}}}));
 const [inventory,spn,saints,catalogue]=await Promise.all([
  inventoryPromise,spnPromise,saintsPromise,
  client.place.findMany({select:{id:true,name:true,alternateNames:true,region:true,country:true,placeKind:true}})
 ]);
 const rows=inventory.saints.map(saint=>{
  const entries=inventory.entriesBySaintId.get(saint.id)??[];
  const websitePlaces=(saints.find(s=>s.id===saint.id)?.places??[]).map(link=>({...link.place,placeType:link.placeType}));
  const placements=spn.placements.filter(p=>p.saintId===saint.id);
  const proposals=[...new Map(placements.map(p=>[JSON.stringify([p.section,p.tier]),{
   section:p.section,tier:p.tier,confidence:p.confidence,rationale:p.rationale,
   alternatives:p.alternatives,spnState:p.placementState??"Proposed",
   evidence:"inherited_spn" as const,state:"Proposed" as const
  }])).values()];
  const comparisons=[...new Set(entries.map(e=>e.sourcePlaceText))].map(text=>compareMuseumSourcePlace(text,websitePlaces,catalogue));
  const sourceSections=[...new Set(comparisons.flatMap(c=>c.catalogueCandidates.flatMap(p=>{
   const section=museumSectionForLocality({locality:p.name,region:p.region,country:p.country??"",localityPlaceId:p.id});return section?[section]:[];
  })))];
  const spiritualRegions=websitePlaces.filter(p=>p.placeKind==="spiritual_region").map(p=>({id:p.id,name:p.name}));
  const primaryPlaces=websitePlaces.filter(p=>p.placeType==="primary"&&p.placeKind!=="spiritual_region").map(p=>({id:p.id,name:p.name,region:p.region,country:p.country}));
  const needsSectionReview=proposals.length!==1||placements.some(p=>p.placementState?.startsWith("Conflicting"));
  return {saintId:saint.id,name:saint.displayName,saintStatus:saint.status,sourceRows:entries.map(e=>e.sourceRow),
   sourcePackaging:entries.map(e=>({id:e.observationId,sourceRow:e.sourceRow,packagingText:e.packagingText,quantityText:e.quantityText,packaging:e.packaging})),
   spiritualRegions,primaryPlaces,websitePlaces:websitePlaces.map(p=>({id:p.id,name:p.name,placeType:p.placeType,placeKind:p.placeKind,region:p.region,country:p.country})),
   proposals,needsSectionReview,placeComparisons:comparisons,sourceGeographicSectionCandidates:sourceSections,
   geographicSectionDifference:sourceSections.some(section=>!proposals.some(p=>p.section===section)),
   guidance:"Inherit SPN as a Vrindavan proposal only. Source geography requires research before changing shared saint places or either museum's section proposal; lineage and reviewed curator decisions may take precedence."};
 });
 return {museum:inventory.museum,snapshotHash:inventory.snapshotHash,generatedAt:new Date().toISOString(),
  sectionCatalogue:vrindavanSubsectionCatalogue(spn.sections),rows,
  summary:{confirmedEntries:inventory.counts.confirmedEntries,saints:rows.length,
   singleInheritedProposal:rows.filter(r=>r.proposals.length===1&&!r.needsSectionReview).length,
   needsSectionReview:rows.filter(r=>r.needsSectionReview).length,
   sourcePlaceDifferences:rows.filter(r=>r.placeComparisons.some(p=>p.needsResearch)).length,
   geographicSectionDifferences:rows.filter(r=>r.geographicSectionDifference).length},
  unavailableIdentityEntries:inventory.counts.unavailableIdentityEntries,
  policy:"Read-only proposals and source comparisons. No saint places, spiritual regions, museum sections or placements are written."};
}