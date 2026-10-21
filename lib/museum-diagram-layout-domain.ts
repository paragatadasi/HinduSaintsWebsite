import {z} from "zod";
import graph from "../data/museum/vrindavan-connected-traditions.json";

import {VRINDAVAN_APPROVED_SUBSECTIONS} from "./vrindavan-approved-subsections";
export const DIAGRAM_GRAPH_VERSION=graph.version+"-approved-subsections-v2";
export const DIAGRAM_NODE_IDS=[...new Set([...graph.regions.flatMap(region=>region.subsections.map(section=>section.existingSlug)),...VRINDAVAN_APPROVED_SUBSECTIONS.map(section=>section.slug)])];
const knownNodes=new Set(DIAGRAM_NODE_IDS);
export const diagramPositions=z.array(z.object({nodeId:z.string().min(1).max(180).refine(id=>knownNodes.has(id),"This diagram section is no longer available."),x:z.number().finite().min(0).max(1),y:z.number().finite().min(0).max(1)}).strict()).min(1).max(200).refine(rows=>new Set(rows.map(row=>row.nodeId)).size===rows.length,"A diagram section can only appear once.");
const museum=z.literal("museum-vrindavan");
const id=z.string().uuid();
const revision=z.string().regex(/^[a-f0-9]{64}$/);
export const diagramSaveInput=z.object({museumId:museum,revision,id:id.optional(),name:z.string().trim().min(1).max(80).refine(value=>!["original connections","current museum proposal"].includes(value.toLocaleLowerCase("en")),"Choose a different name for your saved view.").refine(value=>!/[\u0000-\u001f\u007f]/.test(value),"Use a single-line arrangement name."),positions:diagramPositions,areaRevision:revision.optional()}).strict();
export const diagramDeleteInput=z.object({museumId:museum,revision,id}).strict();
export const savedDiagramSchema=z.object({schemaVersion:z.literal(1),graphVersion:z.string().min(1).max(200),areaRevision:revision.optional(),id,name:z.string().min(1).max(80),positions:diagramPositions,updatedAt:z.string().datetime(),updatedById:z.string().min(1)}).strict();
export const diagramSnapshotSchema=z.object({version:z.literal(1),layouts:z.array(savedDiagramSchema).max(30)}).strict();
export type SavedDiagramLayout=z.infer<typeof savedDiagramSchema>;
export type DiagramLayouts={museumId:"museum-vrindavan";revision:string;layouts:SavedDiagramLayout[]};

// Pure transition shared by persistence tests. It never includes saint, family,
// vitrine or physical-placement effects.
export function changeDiagramLayouts(layouts:SavedDiagramLayout[],input:z.infer<typeof diagramSaveInput>,actorId:string,newId:string,now:string):SavedDiagramLayout[]{
 if(input.id&&!layouts.some(layout=>layout.id===input.id))throw Error("This saved arrangement was removed. Reload the list.");
 if(!input.id&&layouts.length>=30)throw Error("Keep up to 30 saved arrangements. Remove one before adding another.");
 if(layouts.some(layout=>layout.id!==input.id&&layout.name.toLocaleLowerCase("en")===input.name.toLocaleLowerCase("en")))throw Error("An arrangement with this name already exists.");
 const saved:SavedDiagramLayout={schemaVersion:1,graphVersion:DIAGRAM_GRAPH_VERSION,...(input.areaRevision?{areaRevision:input.areaRevision}:{}),id:input.id??newId,name:input.name,positions:input.positions,updatedAt:now,updatedById:actorId};
 return input.id?layouts.map(layout=>layout.id===input.id?saved:layout):[...layouts,saved];
}