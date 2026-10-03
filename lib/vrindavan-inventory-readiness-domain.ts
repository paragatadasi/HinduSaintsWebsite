import type {MuseumSourceInventoryEntry} from "./museum-source-inventory-domain";
import type {z} from "zod";
import {reviewedDecisionSchema} from "./reviewed-museum-correction-domain";

type Decision = z.infer<typeof reviewedDecisionSchema>;
const normalizedPlace = (value:string) => value.trim().normalize("NFKC").toLocaleLowerCase("en");

// A source row is evidence, never a verified individual object or physical placement.
export function projectVrindavanInventoryReadiness(entry:MuseumSourceInventoryEntry, decisions:readonly Decision[]=[]) {
 const quantity=entry.quantityText.trim();
 const quantityKind=quantity===""?"missing":/^[1-9][0-9]*$/.test(quantity)?"positive_integer_text":"requires_interpretation";
 const reasons:string[]=[];
 if(!entry.physicalItemId)reasons.push("physical_object_identity_required");
 if(!entry.relicDescription.trim())reasons.push("relic_description_missing");
 if(quantityKind!=="positive_integer_text")reasons.push("quantity_clarification_required");
 if(!entry.sourceLocation)reasons.push("source_display_missing");
 else if(!entry.positionText.trim())reasons.push("source_position_missing");
 if(entry.unavailableSaintIds.length||!entry.saintIds.length)reasons.push("identity_reconciliation_required");
 if(entry.saintIds.length>1)reasons.push("multiple_saint_associations");
 if(entry.comments.trim()||entry.warnings.length)reasons.push("source_notes_require_review");
 const geographyReviews=decisions.filter(d=>entry.saintIds.includes(d.saintId)).map(d=>({
  saintId:d.saintId,batch:d.batch,note:d.note,section:d.section,
  sourcePlaceError:d.sourcePlaceError,
  sourcePlaceExcluded:!!d.sourcePlaceError&&normalizedPlace(entry.sourcePlaceText)===normalizedPlace(d.sourcePlaceError)
 }));
 return {...entry,quantityKind,reviewReasons:reasons,geographyReviews,
  // False is deliberate: source identity confirmation never verifies item-level placement.
  physicalPlacementVerified:false as const,
  sourceGeographyUsableForSaintIds:entry.saintIds.filter(id=>!geographyReviews.some(d=>d.saintId===id&&d.sourcePlaceExcluded))};
}
