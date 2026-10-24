import {createHash} from "node:crypto";
import type {MuseumSaintPlacement} from "./museum-proposals";
import {stable} from "./museum-update-domain";

export type TierAuditIdentity={id:string;slug:string;displayName:string;status:string;publicationStatus:string;biographySummary:string|null;aliases:{alias:string}[];biographies:{id:string;title:string;bodyMarkdown:string;status:string}[]};
export type TierAuditSource={externalId:string;entityId:string|null};

export function buildSpnTierAudit(baseline:MuseumSaintPlacement[],effective:MuseumSaintPlacement[],identities:TierAuditIdentity[],sources:TierAuditSource[]) {
 const original=new Map(baseline.map(row=>[row.id,row]));
 const rows=effective.map(row=>({
  placementId:row.id,saintId:row.saintId??null,sourceRecordId:row.sourceRecordId??null,name:row.name,
  section:row.section,baselineTier:original.get(row.id)?.tier??null,effectiveTier:row.tier,
  state:row.placementState??null,linkIssue:row.linkIssue??null,confidence:row.confidence,rationale:row.rationale,note:row.note,
  familyKey:row.curatorialFamily||row.familyId||null,groupLabel:row.groupLabel??null,
  reviewed:row.proposalReviewed??false,familyReconciliation:row.familyReconciliation??null,
  displayMembership:row.displayMembership??null,arrangement:row.arrangement??null,
  normalizedPlaces:row.normalizedPlaces,tradition:row.sampradaya,
  sourceLocation:row.sourceVitrine??null,
 })).sort((a,b)=>a.placementId.localeCompare(b.placementId));
 const ids=new Set([...rows.flatMap(row=>row.saintId?[row.saintId]:[]),...sources.flatMap(source=>source.entityId?[source.entityId]:[])]);
 const records=identities.filter(saint=>ids.has(saint.id)).map(saint=>{
  const placements=rows.filter(row=>row.saintId===saint.id);
  const published=saint.status==="published";
  return {saintId:saint.id,name:saint.displayName,slug:saint.slug,status:saint.status,publicationStatus:saint.publicationStatus,
   publicProfile:published?`/saints/${saint.slug}`:null,adminProfile:`/admin/saints/${saint.slug}`,
   aliases:saint.aliases.map(alias=>alias.alias).sort(),placements,
   sourceKeys:sources.filter(source=>source.entityId===saint.id).map(source=>source.externalId).sort(),
   publicBiography:{summary:published?saint.biographySummary:null,
    biographies:published?saint.biographies.filter(b=>b.status==="published").map(b=>({id:b.id,title:b.title,bodyMarkdown:b.bodyMarkdown})).sort((a,b)=>a.id.localeCompare(b.id)):[],
    qualification:"Content for evidence review only; presence or length does not automatically qualify a tier."},
   issues:[...(!placements.length?["project source link exists but no SPN working placement"]:[]),...(placements.length>1?["multiple placement rows; retain each proposal and review conflicts"]:[]),
    ...(placements.some(p=>p.state?.startsWith("Conflicting"))?["conflicting museum proposals or assignments"]:[])],
  };
 }).sort((a,b)=>a.saintId.localeCompare(b.saintId));
 const unlinked=rows.filter(row=>!row.saintId);
 const counts={placementRows:rows.length,canonicalRecords:records.length,unlinkedSourceRows:unlinked.length,
  recordsWithMultiplePlacements:records.filter(record=>record.placements.length>1).length,
  recordsWithoutWorkingPlacement:records.filter(record=>!record.placements.length).length,
  primaryRows:rows.filter(row=>row.effectiveTier==="Featured").length,
  secondaryRows:rows.filter(row=>row.effectiveTier==="Secondary").length,
  tertiaryRows:rows.filter(row=>row.effectiveTier==="Tertiary").length};
 const fingerprint=createHash("sha256").update(stable({records,unlinked})).digest("hex");
 return {schemaVersion:1,museumId:"museum-spn",fingerprint,counts,records,unlinked,
  policy:"Read-only research snapshot. Canonical IDs deduplicate records, not historical people: possible duplicate IDs remain separate. Deities, sites and compound observations are not automatically classified as human saints. No tier recommendation or mutation is implied. Baseline, effective family projection and reviewed decisions remain distinct. Public biography evidence follows the public reader's published status; external biographies require cited review."};
}
