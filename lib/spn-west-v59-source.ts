import {db} from "./db";
import type {Prisma} from "./generated/prisma/client";
import type {readMuseumData} from "./museum-working-data";
import {readGuideAlternativeDestinations} from "./museum-guide-alternatives";
import {readEffectiveCompanionAdditions} from "./museum-companion-additions-state";
import {currentCompanionAdditions} from "./museum-companion-addition-validation";
import {buildLatestSpnReview} from "./spn-reviewed-proposal";
import {projectWestV59Guide} from "./spn-west-v59-guide";
import {projectCurrentGuideLifeStatus} from "./museum-guide-life-status";
import type {PhysicalState} from "./spn-move-guide";

export async function readWestV59Guide(current:Awaited<ReturnType<typeof readMuseumData>>,physical:PhysicalState,alternatives?:Awaited<ReturnType<typeof readGuideAlternativeDestinations>>,client:Prisma.TransactionClient=db){
 const [saved,additions]=await Promise.all([alternatives??readGuideAlternativeDestinations(client),readEffectiveCompanionAdditions(client)]);
 const valid=currentCompanionAdditions(additions,physical.rows);
 const review=buildLatestSpnReview(current.placements,[...valid,...saved.filter(row=>!valid.some(addition=>addition.sourceId===row.sourceId))],physical.rows);
 const guide=projectWestV59Guide(current.placements,physical,review);
 return {...guide,entries:projectCurrentGuideLifeStatus(guide,current).entries};
}
