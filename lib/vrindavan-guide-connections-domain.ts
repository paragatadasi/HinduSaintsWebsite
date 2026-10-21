import manifest from "../data/museum/vrindavan-guide-connections-v9.json";
export type GuideEndpoint={kind:"saint";saintId:string;label:string;guideVitrine?:string}|{kind:"context";key:string;label:string};
export type GuideKind="teaching"|"succession"|"biological_family"|"partner"|"association"|"incarnation"|"group_membership";
// Direction follows the research statement, never alphabetical ID ordering:
// teaching: teacher -> pupil; succession: predecessor -> successor;
// biological_family: mother -> daughter; partner/wife: husband -> wife;
// incarnation: devotional origin -> traditional manifestation (not biological descent).
// Associations and group memberships retain declared endpoints but are nonstructural.
// No reciprocal claims or formal initiation subtypes are inferred from these labels.
export type GuideConnection={id:string;sectionId:string;from:GuideEndpoint;to:GuideEndpoint;type:string;label:string;kind:GuideKind;structural:boolean;evidence:"research_review"|"traditional_account"|"provisional_archive";confidence:"high"|"medium";sources:{title:string;url:string}[];notes:string[]};
export const guideConnections=manifest.connections as GuideConnection[];
export const guideSections=manifest.sections;
export const guideMetadata={version:manifest.version,guideVersion:manifest.guideVersion,guideSha256:manifest.guideSha256,museum:manifest.museum,proposalSnapshotRevision:manifest.proposalSnapshotRevision,proposalSnapshotGeneratedAt:manifest.proposalSnapshotGeneratedAt,policy:manifest.policy,heldCases:manifest.heldCases};
export type GuidePerson={id:string;name:string;slug:string;status:string;birthYear:number|null;samadhiYear:number|null};
export type GuidePlacement={saintId:string;section:string;tier:string;familyKey:string;familyLabel:string;proposalRevision:string;arrangement:{status:string;vitrine:string;shelf:string}|null};
export type GuideCanonicalClaim={id:string;fromSaintId:string;toSaintId:string;relationshipType:string;status:string;evidenceStatus:string;confidence:string;notes?:string|null};
export type GuideCanonicalState="reviewed_match"|"unreviewed_match"|"missing"|"type_conflict"|"context_only"|"unavailable_identity";
function expectedTypes(c:GuideConnection){return c.kind==="teaching"?["guru","disciple","initiator"]:c.kind==="succession"?["successor"]:c.kind==="biological_family"?["mother","parent","child","daughter"]:c.kind==="partner"?["wife","husband","partner"]:c.kind==="incarnation"?["incarnation"]:c.kind==="association"?["associated","influence","contemporary","related"]:[];}
function directionMatches(c:GuideConnection,e:GuideCanonicalClaim){
 if(c.from.kind!=="saint"||c.to.kind!=="saint")return false;
 const f=c.from.saintId,t=c.to.saintId;
 if(c.kind==="teaching")return e.relationshipType==="guru"?e.fromSaintId===t&&e.toSaintId===f:e.fromSaintId===f&&e.toSaintId===t;
 if(c.kind==="succession")return e.fromSaintId===f&&e.toSaintId===t;
 if(c.kind==="biological_family")return ["child","daughter"].includes(e.relationshipType)?e.fromSaintId===t&&e.toSaintId===f:e.fromSaintId===f&&e.toSaintId===t;
 return true;
}
// Pure projection only: never derives a tier, joins families or writes a relationship.
export function projectGuideConnections(people:GuidePerson[],claims:GuideCanonicalClaim[],placements:GuidePlacement[],connections:GuideConnection[]=guideConnections){
 const persons=new Map(people.filter(p=>p.status!=="archived").map(p=>[p.id,p]));
 const current=new Map(placements.map(p=>[p.saintId,p]));
 const endpoint=(ep:GuideEndpoint)=>ep.kind==="context"?{...ep,id:"guide-context:"+ep.key,contextOnly:true as const,presence:"none" as const,available:true,person:null,placement:null}:{...ep,id:ep.saintId,contextOnly:false as const,presence:current.has(ep.saintId)?"source" as const:"none" as const,available:persons.has(ep.saintId),person:persons.get(ep.saintId)??null,placement:current.get(ep.saintId)??null};
 return connections.map(c=>{
  const from=endpoint(c.from),to=endpoint(c.to);
  const pair=c.from.kind==="saint"&&c.to.kind==="saint"?claims.filter(e=>e.status!=="archived"&&((e.fromSaintId===from.id&&e.toSaintId===to.id)||(e.toSaintId===from.id&&e.fromSaintId===to.id))):[];
  const matches=pair.filter(e=>expectedTypes(c).includes(e.relationshipType)&&directionMatches(c,e));
  const reviewed=matches.filter(e=>e.status==="published"&&["certain","probable","traditional"].includes(e.evidenceStatus)&&["high","medium"].includes(e.confidence));
  const canonicalState:GuideCanonicalState=!from.available||!to.available?"unavailable_identity":from.contextOnly||to.contextOnly?"context_only":reviewed.length?"reviewed_match":matches.length?"unreviewed_match":pair.length?"type_conflict":"missing";
  const planningSnapshotChanged=[from,to].some(ep=>ep.kind==="saint"&&ep.guideVitrine!==undefined&&(!ep.placement||ep.placement.arrangement?.vitrine!==ep.guideVitrine));
  return {...c,from,to,planningSnapshotChanged,canonicalState,canonicalClaims:pair,matchingClaimIds:matches.map(e=>e.id),reviewedClaimIds:reviewed.map(e=>e.id),displayOnly:true as const,planningEffects:"none" as const};
 });
}
export type ResolvedGuideConnection=ReturnType<typeof projectGuideConnections>[number];
