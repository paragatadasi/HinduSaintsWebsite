import {z} from "zod";
import {hasCapability} from "./permissions";
import type {UserRole} from "./generated/prisma/client";
import {savedAdditionReference} from "./museum-assistant-placement-domain";

// Assistant authority covers one existing placement recommendation, not planning or clearing.
const placementCheck=z.object({
 museumId:z.literal("museum-spn"),
 guideContext:z.object({guideVersion:z.string().min(1),contentDigest:z.string().min(1),assignmentDigest:z.string().min(1)}),
 curatorAddition:savedAdditionReference.optional(),alternativeDecision:z.never().optional(),caseContentsStaging:z.never().optional(),
 records:z.array(z.object({sourceId:z.string().min(1),to:z.object({kind:z.literal("vitrine"),code:z.string().min(1),shelf:z.string().max(100).optional()}).passthrough()}).passthrough()).length(1),
 action:z.never().optional(),clearedVitrines:z.never().optional(),initialCaseClearAcknowledged:z.never().optional(),
 componentStagingAcknowledgements:z.never().optional(),retainedCaseClearanceAcknowledgement:z.never().optional()
}).passthrough().refine(body=>body.records.length===1&&(body.curatorAddition?body.curatorAddition.sourceId===body.records[0].sourceId:body.records[0].to.shelf===undefined));
export function canConfirmMuseumPlacement(roles:readonly UserRole[]){
 return hasCapability(roles,"manage_museum")||hasCapability(roles,"confirm_museum_placements");
}
export function museumPhysicalWriteAllowed(roles:readonly UserRole[],body:unknown){
 return hasCapability(roles,"manage_museum")||(hasCapability(roles,"confirm_museum_placements")&&placementCheck.safeParse(body).success);
}
