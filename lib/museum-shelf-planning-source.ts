import {readEffectiveCompanionAdditions} from "./museum-companion-additions-state";
import {readGuideAlternativeDestinations} from "./museum-guide-alternatives";
import {projectShelfPlanningContext,type ShelfPlanningPacket} from "./museum-shelf-planning-context";
import type {readMuseumData} from "./museum-working-data";
import type {PhysicalState} from "./spn-move-guide";

// Call only behind the existing museum access checks; reuse the page's current physical snapshot.
export async function readShelfPlanningContext(packet:ShelfPlanningPacket,current:Awaited<ReturnType<typeof readMuseumData>>,physical:PhysicalState,alternatives?:Awaited<ReturnType<typeof readGuideAlternativeDestinations>>){
 const [effectiveAlternatives,additions]=await Promise.all([alternatives??readGuideAlternativeDestinations(),readEffectiveCompanionAdditions()]);
 return projectShelfPlanningContext(packet,{current,physical,alternatives:effectiveAlternatives,additions});
}
