import {getMuseumProposalData} from "@/lib/museum-proposals";
import {proposalFamilyKey} from "@/lib/museum-family-move-domain";
import {db} from "@/lib/db";
import {Prisma} from "@/lib/generated/prisma/client";
import {MuseumConflict,lockMuseumSaint} from "@/lib/museum-service";
import {readMuseumData} from "@/lib/museum-working-data";

export async function changeMuseumDisplayMembership(input:{placementId:string;familyKey:string;revision:string;action:"detach"|"restore";actorId:string}) {
 return db.$transaction(async tx=>{
  await tx.$queryRaw(Prisma.sql`SELECT true AS locked FROM pg_advisory_xact_lock(hashtextextended(${"museum-family:"+input.familyKey},0))`);
  // Canonical placement edits share the saint lock with the existing editor.
  const assignment=await tx.saintMuseumSection.findUnique({where:{id:input.placementId},include:{saint:{include:{museumState:true}},museumSection:true}});
  if(assignment) await tx.$queryRaw(Prisma.sql`SELECT id FROM "Saint" WHERE id=${assignment.saintId} FOR UPDATE`);
  const data=await readMuseumData(tx);
  const row=data.placements.find(p=>p.id===input.placementId);
  const control=row?.displayMembership;
  if(!row || !control || control.familyKey!==input.familyKey || control.revision!==input.revision)
   throw new MuseumConflict("This display membership changed. Reload the saint before saving.");
  if(control.detached === (input.action==="detach")) throw new MuseumConflict("This membership was already changed. Reload the saint.");
  const before=await tx.museumDisplayMembership.findUnique({where:{museumId_placementId:{museumId:"museum-spn",placementId:input.placementId}}});
  if(!assignment && input.action==="restore") {
   const source=getMuseumProposalData().placements.find(p=>p.id===input.placementId);
   if(!source || proposalFamilyKey(source)!==input.familyKey) throw new MuseumConflict("The source family changed since this removal. Review the proposal before restoring membership.");
  }
  let wasAnchor=before?.wasAnchor || false;
  if(assignment) {
   if(assignment.status!=="published" || assignment.assignmentType!=="primary" || assignment.museumSection.status==="archived") throw new MuseumConflict("This placement is no longer active.");
   const groupId=input.familyKey.startsWith("exhibit:")?input.familyKey.slice(8):"";
   const group=groupId?await tx.museumExhibitGroup.findUnique({where:{id:groupId}}):null;
   if(!group || group.museumSectionId!==assignment.museumSectionId) throw new MuseumConflict("The display group changed sections. Review the placement before restoring membership.");
   await lockMuseumSaint(tx,assignment.saintId,assignment.saint.museumState?.version || 0);
   await tx.saintMuseumSection.update({where:{id:assignment.id},data:{exhibitGroupId:input.action==="detach"?null:group.id}});
   if(input.action==="detach") wasAnchor=group.anchorSaintId===assignment.saintId;
   if(input.action==="restore" && wasAnchor && !group.anchorSaintId)
    await tx.museumExhibitGroup.update({where:{id:group.id},data:{anchorSaintId:assignment.saintId}});
   if(input.action==="detach" && group.anchorSaintId===assignment.saintId)
    await tx.museumExhibitGroup.update({where:{id:group.id},data:{anchorSaintId:null}});
  }
  const after=await tx.museumDisplayMembership.upsert({
   where:{museumId_placementId:{museumId:"museum-spn",placementId:input.placementId}},
   create:{museumId:"museum-spn",placementId:input.placementId,familyKey:input.familyKey,familyLabel:control.label,section:row.section,detached:input.action==="detach",wasAnchor,updatedById:input.actorId},
   update:{familyKey:input.familyKey,familyLabel:control.label,section:row.section,detached:input.action==="detach",wasAnchor,version:{increment:1},updatedById:input.actorId}
  });
  await tx.auditEvent.create({data:{userId:input.actorId,action:"museum.display_membership."+input.action,entityType:"MuseumDisplayMembership",entityId:input.placementId,
   beforeJson:{familyKey:control.familyKey,section:row.section,detached:control.detached,version:before?.version||0},
   afterJson:{familyKey:after.familyKey,section:after.section,detached:after.detached,version:after.version,wasAnchor:after.wasAnchor}}});
  return {saintName:row.name};
 },{timeout:30000});
}

export async function requestMuseumRelationshipCorrection(input:{saintId:string;note:string;actorId:string}) {
 return db.$transaction(async tx=>{
  const saint=await tx.saint.findFirst({where:{id:input.saintId,status:{not:"archived"}},select:{id:true,displayName:true}});
  if(!saint) throw new MuseumConflict("The saint is no longer available.");
  await tx.$queryRaw(Prisma.sql`SELECT true AS locked FROM pg_advisory_xact_lock(hashtextextended(${"museum-relationship-correction:"+saint.id},0))`);
  const message="Curator requested relationship review for "+saint.displayName+": "+input.note;
  const existing=await tx.reconciliationIssue.findFirst({where:{issueType:"museum_relationship_correction",entityType:"Saint",entityId:saint.id,status:"open",message}});
  if(existing)return saint.displayName;
  const issue=await tx.reconciliationIssue.create({data:{issueType:"museum_relationship_correction",severity:"warning",entityType:"Saint",entityId:saint.id,message}});
  await tx.auditEvent.create({data:{userId:input.actorId,action:"museum.relationship.correction_requested",entityType:"ReconciliationIssue",entityId:issue.id,afterJson:{saintId:saint.id,note:input.note}}});
  return saint.displayName;
 });
}
