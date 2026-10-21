import {createHash,randomUUID} from "node:crypto";
import {db} from "./db";
import {Prisma} from "./generated/prisma/client";
import {hasCapability} from "./permissions";
import {MuseumConflict} from "./museum-service";
import {DIAGRAM_NODE_IDS,DIAGRAM_GRAPH_VERSION,diagramSaveInput,diagramDeleteInput,diagramSnapshotSchema,changeDiagramLayouts,type DiagramLayouts} from "./museum-diagram-layout-domain";
const museumId="museum-vrindavan";
const entityType="MuseumDiagramLayouts";
const json=(value:unknown):Prisma.InputJsonValue=>JSON.parse(JSON.stringify(value));

async function authorize(tx:Prisma.TransactionClient,actorId:string,write:boolean){
 const actor=await tx.user.findUnique({where:{id:actorId},select:{active:true,roles:true}});
 if(!actor?.active||!hasCapability(actor.roles,"access_museum")||!hasCapability(actor.roles,"view_full_saint_catalog")||(write&&!hasCapability(actor.roles,"manage_museum")))throw new MuseumConflict(write?"Museum editing permission is required.":"Museum access is required.");
}
async function current(tx:Prisma.TransactionClient):Promise<DiagramLayouts>{
 const event=await tx.auditEvent.findFirst({where:{entityType,entityId:museumId},orderBy:[{createdAt:"desc"},{id:"desc"}]});
 const snapshot=event?diagramSnapshotSchema.safeParse(event.afterJson):null;
 if(snapshot&&!snapshot.success)throw new MuseumConflict("The saved diagram data needs review before it can be changed.");
 const layouts=snapshot?.success?snapshot.data.layouts:[];
 const revision=createHash("sha256").update(JSON.stringify({museumId,event:event?.id??null,nodes:DIAGRAM_NODE_IDS,graphVersion:DIAGRAM_GRAPH_VERSION})).digest("hex");
 return {museumId,revision,layouts};
}
export async function readMuseumDiagramLayouts(id:string,actorId:string):Promise<DiagramLayouts>{
 if(id!==museumId)throw new MuseumConflict("This diagram is only available for Vrindavan.");
 await authorize(db,actorId,false);return current(db);
}
async function mutate(raw:unknown,actorId:string,remove:boolean):Promise<DiagramLayouts>{
 const input=remove?diagramDeleteInput.parse(raw):diagramSaveInput.parse(raw);
 try{return await db.$transaction(async tx=>{
  await tx.$queryRaw(Prisma.sql`SELECT true FROM pg_advisory_xact_lock(hashtextextended(${"museum-diagram:"+museumId},0))`);
  await authorize(tx,actorId,true);
  const before=await current(tx);
  if(input.revision!==before.revision)throw new MuseumConflict("The saved arrangements changed. Reload before saving.");
  let layouts=before.layouts;
  if(remove){
   if(!layouts.some(layout=>layout.id===input.id))throw new MuseumConflict("This arrangement was removed. Reload the list.");
   layouts=layouts.filter(layout=>layout.id!==input.id);
  }else{
   try{layouts=changeDiagramLayouts(layouts,diagramSaveInput.parse(input),actorId,randomUUID(),new Date().toISOString());}
   catch(error){throw new MuseumConflict(error instanceof Error?error.message:"Check the arrangement.");}
  }
  await tx.auditEvent.create({data:{userId:actorId,action:remove?"museum.diagram_layout.deleted":"museum.diagram_layout.saved",entityType,entityId:museumId,beforeJson:json({version:1,layouts:before.layouts}),afterJson:json({version:1,layouts})}});
  return current(tx);
 },{isolationLevel:"Serializable",timeout:30000});}
 catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2034")throw new MuseumConflict("The saved arrangements changed while saving. Reload and try again.");throw error;}
}
export const saveMuseumDiagramLayout=(raw:unknown,actorId:string)=>mutate(raw,actorId,false);
export const deleteMuseumDiagramLayout=(raw:unknown,actorId:string)=>mutate(raw,actorId,true);