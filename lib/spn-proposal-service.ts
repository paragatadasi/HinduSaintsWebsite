import {db} from "./db";
import {Prisma} from "./generated/prisma/client";
import {MuseumConflict} from "./museum-service";
import {readMuseumData} from "./museum-working-data";
import {spnBaselineRevision,spnProposalInput,spnReviewRevision} from "./spn-proposal-domain";

export async function saveSpnProposal(raw:unknown,actorId:string){
 const input=spnProposalInput.parse(raw);
 return db.$transaction(async tx=>{
  await tx.$queryRaw(Prisma.sql`SELECT true FROM pg_advisory_xact_lock(hashtextextended(${"museum-curator:museum-spn"},0))`);
  await tx.$queryRaw(Prisma.sql`SELECT id FROM "Saint" WHERE id=${input.saintId} FOR UPDATE`);
  const working=await readMuseumData(tx);
  const rows=working.placements.filter(p=>p.saintId===input.saintId);
  const row=rows[0];
  if(rows.length!==1||!row||row.linkIssue||row.placementState?.startsWith("Conflicting"))throw new MuseumConflict("Resolve the saint identity or competing proposals before saving.");
  if(spnReviewRevision(row)!==input.revision)throw new MuseumConflict("This proposal or arrangement changed. Reload and compare before saving.");
  if(row.isExhibitAnchor&&input.familyKey!==(row.curatorialFamily||row.familyId))throw new MuseumConflict("Review the display anchor before changing its family.");
  if(!working.sections.some(s=>s.name===input.section))throw new MuseumConflict("Choose an available SPN section.");
  const family=input.familyKey?working.sections.flatMap(s=>s.families.map(f=>({...f,section:s.name}))).filter(f=>f.key===input.familyKey):[];
  if(input.familyKey&&(!family.length||family.some(f=>f.section!==input.section)))throw new MuseumConflict("Choose a family in the selected section; resolve a split family separately.");
  if(row.section===input.section&&row.tier===input.tier&&(row.curatorialFamily||row.familyId||"")===input.familyKey&&row.spnProposal?.state==="applied")return row.name;
  const baseline=(await readMuseumData(tx,{applyScopedProposals:false})).placements.filter(p=>p.saintId===input.saintId);
  if(baseline.length!==1)throw new MuseumConflict("The source identity changed. Reload before saving.");
  const saved=await tx.museumArrangement.findUnique({where:{museumId_placementId:{museumId:"museum-spn",placementId:row.id}}});
  // Never revive an already stale plan or invent a physical confirmation.
  const retain=saved&&saved.proposalRevision===row.arrangement?.proposalRevision;
  await tx.auditEvent.create({data:{userId:actorId,action:"museum.spn_proposal.saved",entityType:"Saint",entityId:input.saintId,
   beforeJson:JSON.parse(JSON.stringify({id:row.id,section:row.section,tier:row.tier,familyKey:row.curatorialFamily||row.familyId,arrangement:row.arrangement})),
   afterJson:{baselineRevision:spnBaselineRevision(baseline[0]),placementId:row.id,saintId:input.saintId,section:input.section,tier:input.tier,familyKey:input.familyKey,familyLabel:family[0]?.label||"",reason:input.reason}}});
  if(retain){
   const next=(await readMuseumData(tx)).placements.find(p=>p.id===row.id);
   if(next?.spnProposal?.state!=="applied"||!next.arrangement)throw new MuseumConflict("The proposal changed while saving. Reload before applying it.");
   await tx.museumArrangement.update({where:{museumId_placementId:{museumId:"museum-spn",placementId:row.id}},data:{proposalRevision:next.arrangement.proposalRevision,version:{increment:1}}});
  }
  return row.name;
 },{isolationLevel:"Serializable",maxWait:10000,timeout:60000}).catch((error:unknown)=>{
  if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2034")throw new MuseumConflict("The proposal changed while saving. Reload and compare before trying again.");
  throw error;
 });
}
