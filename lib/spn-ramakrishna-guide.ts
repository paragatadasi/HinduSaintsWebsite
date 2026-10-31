import {createHash} from "node:crypto";
import {fillFirstMoveGuide,fillFirstGuideDefinition} from "./spn-fill-first-guide";
import {gosaijiSaiMoveGuide,gosaijiSaiGuideDefinition} from "./spn-gosaiji-sai-guide";
import {projectScopedMoveGuide} from "./spn-datta-guide";
import type {GuideDefinition} from "./spn-starter-guide-registry";
import type {PhysicalState,StarterMoveGuide} from "./spn-move-guide";
const entries=[...fillFirstMoveGuide.entries,...gosaijiSaiMoveGuide.entries.filter(row=>row.destination!=="75")];
const vitrines=[...fillFirstMoveGuide.vitrines,...gosaijiSaiMoveGuide.vitrines.filter(row=>row.code!=="75")];
const hash=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const ramakrishnaGuideContext={guideVersion:"spn-ramakrishna-expanded-2026-10-29-v1",contentDigest:hash([fillFirstMoveGuide.contentDigest,gosaijiSaiMoveGuide.contentDigest]),assignmentDigest:hash(entries.map(e=>[e.sourceId,e.destination]).sort((a,b)=>a[0].localeCompare(b[0])))};
if(entries.length!==75||new Set(entries.map(e=>e.sourceId)).size!==75)throw new Error("The combined phase must contain 75 distinct source entries.");
export const ramakrishnaGuideDefinition:GuideDefinition={context:ramakrishnaGuideContext,
 previousVersions:[fillFirstMoveGuide.version,gosaijiSaiMoveGuide.version],
 suggestions:[...fillFirstGuideDefinition.suggestions,...gosaijiSaiGuideDefinition.suggestions.filter(s=>s.targetVitrine!=="75")],
 physicalScope:{...gosaijiSaiGuideDefinition.physicalScope!,previousClearanceVersions:[gosaijiSaiMoveGuide.version],preparationVitrines:["75","23","73"],preparatoryTransfers:fillFirstGuideDefinition.physicalScope!.preparatoryTransfers,
 destinations:{...gosaijiSaiGuideDefinition.physicalScope!.destinations,...fillFirstGuideDefinition.physicalScope!.destinations}}};
export const ramakrishnaMoveGuide:StarterMoveGuide={...gosaijiSaiMoveGuide,...ramakrishnaGuideContext,version:ramakrishnaGuideContext.guideVersion,optionalClearVitrines:["4","23","73"],
 title:"Ramakrishna, Bengal, Gosaiji & Sai",proposalLabel:"East–North connections · approved groups",entries,vitrines,previousClearanceVersions:[gosaijiSaiMoveGuide.version],preparationVitrines:["75","23","73"],preparatoryTransfers:fillFirstMoveGuide.preparatoryTransfers,phaseLabel:"Ramakrishna, Bengal, Gosaiji & Sai"};
export function projectRamakrishnaGuide(current:Parameters<typeof projectScopedMoveGuide>[1],physical:PhysicalState){return projectScopedMoveGuide(ramakrishnaMoveGuide,current,physical);}
