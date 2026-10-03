import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { getMuseumProposalData, museumSectionSlug } from "@/lib/museum-proposals";
import { applyFamilyProposalMoves, familyMoveRevision, proposalFamilyKey } from "@/lib/museum-family-move-domain";
import { MuseumConflict } from "@/lib/museum-service";
import { resolveSnapshotIdentity } from "@/lib/museum-domain";
import { applyAcceptedLocalityProposal } from "@/lib/museum-locality-proposals";
import { buildMuseumView } from "@/lib/museum-proposals";
import { airtableIdentity } from "@/lib/museum-domain";

export async function getEditableMuseumProposalData(client: Prisma.TransactionClient = db) {
  const original=getMuseumProposalData();
  const [moves,saints,links,membership]=await Promise.all([
   client.museumFamilyProposalMove.findMany(),
   client.saint.findMany({where:{status:{not:"archived"}},select:{id:true,places:{where:{placeType:"primary"},select:{placeId:true}},visitPlaces:{orderBy:{acceptedAt:"desc"},select:{locality:true,region:true,country:true,localityPlaceId:true}},museumSectionAssignments:{where:{status:"published"},select:{id:true}}}}),
   client.externalRecord.findMany({where:{sourceType:"airtable",entityType:"Saint"},select:{id:true,externalId:true,entityId:true}}),
   client.museumDisplayMembership.findMany({where:{museumId:"museum-spn"}})
  ]);
  const editable=applyFamilyProposalMoves(original,moves,membership);
  const bySaint=new Map(saints.map(s=>[s.id,s]));const active=new Set(bySaint.keys());
  const placements=editable.placements.map(row=>{
   const resolved=resolveSnapshotIdentity(row.id,links,active);
   const saint=resolved.record?.entityId?bySaint.get(resolved.record.entityId):null;
   const visit=saint?.visitPlaces.find(v=>v.localityPlaceId&&saint.places.some(p=>p.placeId===v.localityPlaceId))??null;
   return applyAcceptedLocalityProposal(row,saint?.museumSectionAssignments.length?null:visit,Boolean(row.displayMembership?.detached) || moves.some(m=>m.familyKey===proposalFamilyKey(row)));
  });
  const labels=new Map(editable.sections.flatMap(s=>s.families.map(f=>[f.key,f.label] as const)));
  const trees=new Map(editable.sections.flatMap(s=>s.families.filter(f=>f.treeFile).map(f=>[f.key,f.treeFile!] as const)));
  const view=buildMuseumView(placements,editable.membersById,labels,trees,new Set(placements.filter(p=>p.needsResearch).map(p=>p.id)));
  // Retain section pages even when their last tertiary proposal changes section.
  for(const section of editable.sections) if(!view.sectionBySlug.has(section.slug)) {
   const empty={...section,total:0,featured:0,secondary:0,tertiary:0,confidence:{high:0,medium:0,low:0},rows:[],families:[],primaryGroups:[],secondaryOnlyGroups:[],secondaryUngrouped:[],tertiaryGroups:[],tertiaryUngrouped:[],geography:[],health:[]};
   view.sections.push(empty);view.sectionBySlug.set(empty.slug,empty);
  }
  return {...view,familyMoveOptions:editable.familyMoveOptions};
}

export async function moveMuseumFamilyProposal(args: {
  familyKey: string; section: string; revision: string; actorId: string;
}) {
  return db.$transaction(async tx => {
    // Serializes even the first move, before a row exists to lock.
    await tx.$queryRaw(Prisma.sql`SELECT true AS locked FROM pg_advisory_xact_lock(hashtextextended(${"museum-family:" + args.familyKey}, 0))`);
    const original = getMuseumProposalData();
    const membership = await tx.museumDisplayMembership.findMany({where:{museumId:"museum-spn",familyKey:args.familyKey}});
    const members = original.placements.filter(row => proposalFamilyKey(row) === args.familyKey && !membership.some(change=>change.placementId===row.id&&change.detached));
    if (!members.length) throw new MuseumConflict("This family is no longer available. Reload the section.");
    const before = await tx.museumFamilyProposalMove.findUnique({ where: { familyKey: args.familyKey } });
    if (familyMoveRevision(members, before ?? undefined, membership) !== args.revision)
      throw new MuseumConflict("This family proposal changed. Reload the section before moving it.");
    const definitions = await tx.museumSection.findMany({ select: { name: true, slug: true, status: true } });
    if (definitions.some(s => s.name === args.section && s.status === "archived") ||
      ![...original.sections, ...definitions.filter(s => s.status !== "archived")].some(s => s.name === args.section))
      throw new MuseumConflict("Choose an available museum section.");
    if (members.every(row => (before?.section ?? row.section) === args.section))
      throw new MuseumConflict("This family is already proposed for that section.");
    // Coordinate with individual proposal review without touching confirmed assignments.
    const ids = new Set(members.map(row => row.id));
    const sources = await tx.externalRecord.findMany({ where: { sourceType: "airtable", entityType: "Saint" }, select: { id: true, externalId: true } });
    for (const source of sources.filter(s => ids.has(airtableIdentity(s.externalId)?.recordId ?? "")).sort((a, b) => a.id.localeCompare(b.id)))
      await tx.$queryRaw(Prisma.sql`SELECT id FROM "ExternalRecord" WHERE id = ${source.id} FOR UPDATE`);
    const after = await tx.museumFamilyProposalMove.upsert({
      where: { familyKey: args.familyKey },
      create: { familyKey: args.familyKey, section: args.section, updatedById: args.actorId },
      update: { section: args.section, version: { increment: 1 }, updatedById: args.actorId }
    });
    await tx.auditEvent.create({ data: {
      userId: args.actorId, action: "museum.family.proposal_moved", entityType: "MuseumFamilyProposalMove", entityId: args.familyKey,
      beforeJson: { section: before?.section ?? null, version: before?.version ?? 0, members: members.map(row => ({ id: row.id, section: before?.section ?? row.section })) },
      afterJson: { section: after.section, version: after.version, memberIds: members.map(row => row.id) }
    } });
    return definitions.find(section => section.name === args.section)?.slug ?? museumSectionSlug(args.section);
  }, { timeout: 30000 });
}
