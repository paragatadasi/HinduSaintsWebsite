import {operationalSpnShelfPacket as shelfPacket} from "./spn-east-remainder-shelves";
import {vrajStoryTopsMoveGuide} from "./spn-vraj-story-tops-guide";
import {db} from "./db";
import type {Prisma} from "./generated/prisma/client";
import type {readMuseumData} from "./museum-working-data";
import type {readGuideAlternativeDestinations} from "./museum-guide-alternatives";
import {readEffectiveCompanionAdditions} from "./museum-companion-additions-state";
import {projectShelfPlanningContext} from "./museum-shelf-planning-context";
import {readGuideAlternativeDestinations as readAlternatives} from "./museum-guide-alternatives";
import {projectVrajRemainderGuide} from "./spn-vraj-remainder-guide";
import type {PhysicalState} from "./spn-move-guide";

export async function readVrajRemainderGuide(current:Awaited<ReturnType<typeof readMuseumData>>,physical:PhysicalState,alternatives?:Awaited<ReturnType<typeof readGuideAlternativeDestinations>>,client:Prisma.TransactionClient=db){
 const [savedAlternatives,additions]=await Promise.all([alternatives??readAlternatives(client),readEffectiveCompanionAdditions(client)]);
 const packet={...shelfPacket,vitrines:shelfPacket.vitrines.filter(v=>["32","33","34","35","38"].includes(v.code))};
 const context=projectShelfPlanningContext(packet,{current,physical,alternatives:savedAlternatives,additions});
 return projectVrajRemainderGuide(current.placements,physical,context,vrajStoryTopsMoveGuide);
}
