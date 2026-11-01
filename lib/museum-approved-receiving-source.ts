import {db} from "./db";
import type {Prisma} from "./generated/prisma/client";
import type {createApprovedReceivingGuide} from "./museum-approved-receiving-guide";
import type {readMuseumData} from "./museum-working-data";
import type {PhysicalState} from "./spn-move-guide";
import {readGuideAlternativeDestinations} from "./museum-guide-alternatives";
import {readEffectiveCompanionAdditions} from "./museum-companion-additions-state";
import {currentCompanionAdditions} from "./museum-companion-addition-validation";
import {buildLatestSpnReview} from "./spn-reviewed-proposal";
import {projectCurrentGuideLifeStatus} from "./museum-guide-life-status";

export async function readApprovedReceivingGuide(
 adapter:ReturnType<typeof createApprovedReceivingGuide>,
 current:Awaited<ReturnType<typeof readMuseumData>>,
 physical:PhysicalState,
 alternatives?:Awaited<ReturnType<typeof readGuideAlternativeDestinations>>,
 client:Prisma.TransactionClient=db,
){
 const [saved,additions]=await Promise.all([
  alternatives??readGuideAlternativeDestinations(client),
  readEffectiveCompanionAdditions(client),
 ]);
 const valid=currentCompanionAdditions(additions,physical.rows);
 const review=buildLatestSpnReview(current.placements,[...valid,...saved.filter(row=>!valid.some(addition=>addition.sourceId===row.sourceId))],physical.rows);
 return projectCurrentGuideLifeStatus(adapter.project(current.placements,physical,review),current);
}
