import {eastRemainderShelfPacket} from "./spn-east-remainder-shelves";
import {db} from "./db";
import type {Prisma} from "./generated/prisma/client";
import type {readMuseumData} from "./museum-working-data";
import type {readGuideAlternativeDestinations} from "./museum-guide-alternatives";
import {readEffectiveCompanionAdditions} from "./museum-companion-additions-state";
import {projectShelfPlanningContext} from "./museum-shelf-planning-context";
import {readGuideAlternativeDestinations as readAlternatives} from "./museum-guide-alternatives";
import {projectEastRemainderGuide} from "./spn-east-remainder-guide";
import type {PhysicalState} from "./spn-move-guide";

export async function readEastRemainderGuide(current:Awaited<ReturnType<typeof readMuseumData>>,physical:PhysicalState,alternatives?:Awaited<ReturnType<typeof readGuideAlternativeDestinations>>,client:Prisma.TransactionClient=db){
 const [savedAlternatives,additions]=await Promise.all([alternatives??readAlternatives(client),readEffectiveCompanionAdditions(client)]);
 const packet=eastRemainderShelfPacket;
 const context=projectShelfPlanningContext(packet,{current,physical,alternatives:savedAlternatives,additions});
 return projectEastRemainderGuide(current.placements,physical,context);
}
