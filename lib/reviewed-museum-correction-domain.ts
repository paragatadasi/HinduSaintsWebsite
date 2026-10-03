import {z} from "zod";
import type {MuseumSaintPlacement} from "./museum-proposals";
export const REVIEWED_MUSEUM_BATCH="museum-geography-2026-10-03";
export const reviewedSaints=[
 {id:"cmq4hd4fj00rhdp04eehy5l4a",slug:"sri-haridas-thakur",name:"Sri Haridas Thakur",section:"Gaudiya Vaishnava",note:"User-reviewed: multiple saint-associated localities are legitimate; Gaudiya lineage takes precedence for the museum proposal."},
 {id:"cmq4hd38u00j6dp045lim8o3r",slug:"sri-madhu-pandit-goswami",name:"Sri Madhu Pandit Goswami",section:"Gaudiya Vaishnava",note:"User-reviewed: Vrindavan / Vamshi Vat is the saint-related locality; Jaipur describes his deity's present residence, not where the saint lived."},
 {id:"cmq4hd0p80025dp046wcjsmei",slug:"sri-somappar-swami",name:"Sri Somappar Swāmi",section:null,note:"User-reviewed: retain Madurai / Thiruparankundram. Workbook Mayapur is erroneous source geography."}
] as const;
export const reviewedDecisionSchema=z.object({batch:z.literal(REVIEWED_MUSEUM_BATCH),saintId:z.string(),section:z.string().nullable(),note:z.string(),sourcePlaceError:z.string().nullable()});
export function applyReviewedMuseumProposal(row:MuseumSaintPlacement,decision:z.infer<typeof reviewedDecisionSchema>|undefined) {
 if(!decision?.section)return row;
 return {...row,section:decision.section,alternatives:[...new Set([row.section,...row.alternatives])].filter(s=>s!==decision.section),
 rationale:decision.note,note:[row.note,decision.note].filter(Boolean).join(" ")};
}