import {z} from "zod";
import {hasCapability} from "./permissions";
import type {UserRole} from "./generated/prisma/client";

// Assistant authority covers one existing placement recommendation, not planning or clearing.
const placementCheck=z.object({
 museumId:z.literal("museum-spn"),
 guideContext:z.object({guideVersion:z.string().min(1),contentDigest:z.string().min(1),assignmentDigest:z.string().min(1)}),
 curatorAddition:z.never().optional(),alternativeDecision:z.never().optional(),
 records:z.array(z.object({to:z.object({kind:z.literal("vitrine"),code:z.string().min(1),shelf:z.never().optional()}).passthrough()}).passthrough()).length(1),
 action:z.never().optional(),clearedVitrines:z.never().optional(),initialCaseClearAcknowledged:z.never().optional(),
 componentStagingAcknowledgements:z.never().optional(),retainedCaseClearanceAcknowledgement:z.never().optional()
}).passthrough();
export function canConfirmMuseumPlacement(roles:readonly UserRole[]){
 return hasCapability(roles,"manage_museum")||hasCapability(roles,"confirm_museum_placements");
}
export function museumPhysicalWriteAllowed(roles:readonly UserRole[],body:unknown){
 return hasCapability(roles,"manage_museum")||(hasCapability(roles,"confirm_museum_placements")&&placementCheck.safeParse(body).success);
}
