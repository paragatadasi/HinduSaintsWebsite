import {db} from "./db";
import type {Prisma} from "./generated/prisma/client";
import {readVrindavanMuseumInventory} from "./vrindavan-museum-inventory";
import {readReviewedMuseumDecisions} from "./reviewed-museum-corrections";
import {projectVrindavanInventoryReadiness} from "./vrindavan-inventory-readiness-domain";

// Private read-only contract; callers require access_museum and full catalogue access.
export async function readVrindavanInventoryReadiness(options:{snapshotHash?:string}={},client:Prisma.TransactionClient=db) {
 const [inventory,decisions]=await Promise.all([readVrindavanMuseumInventory(options,client),readReviewedMuseumDecisions(client)]);
 const entries=inventory.entries.map(entry=>projectVrindavanInventoryReadiness(entry,decisions));
 const reasonCounts:Record<string,number>={};
 for(const entry of entries)for(const reason of entry.reviewReasons)reasonCounts[reason]=(reasonCounts[reason]??0)+1;
 return {museum:inventory.museum,snapshotHash:inventory.snapshotHash,generatedAt:new Date().toISOString(),
  saints:inventory.saints,entries,identityCounts:inventory.counts,
  summary:{confirmedSourceEntries:entries.length,linkedSaints:inventory.saints.length,
   linkedPhysicalItems:entries.filter(e=>e.physicalItemId).length,
   reportedLocations:entries.filter(e=>e.sourceLocation).length,
   entriesWithReviewedGeography:entries.filter(e=>e.geographyReviews.length).length,
   entriesWithExcludedSourceGeography:entries.filter(e=>e.geographyReviews.some(d=>d.sourcePlaceExcluded)).length,
   reviewReasonCounts:reasonCounts},
  policy:"Source-row readiness only. Quantities are original text, not verified object counts. No objects, placements, saint places, proposals or identity decisions are changed. Physical placement verification requires the object-level workflow."};
}
