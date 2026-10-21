import {stableCollectionJson} from "./museum-collection-domain";
import {createHash} from "node:crypto";
import type {CuratorReviewCase} from "./museum-curator-review-domain";
import {z} from "zod";
import raw from "../data/museum/vrindavan-curator-confirmation-cases.json";

export function safeMuseumReviewUrl(value:string):string|null {
 if(value.startsWith("/")&&!value.startsWith("//")&&/^\/admin\/(saints|source-data)\//.test(value))return value;
 try{const url=new URL(value);return ["http:","https:"].includes(url.protocol)&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
const optionSchema=z.object({optionId:z.string().min(1),label:z.string().min(1),proposedSection:z.string().nullable(),targetSaintIds:z.array(z.string().min(1)),sources:z.array(z.string()),readiness:z.string(),additionalConditions:z.array(z.string()),proposedChanges:z.array(z.object({field:z.string(),fromValue:z.unknown().optional(),toValue:z.unknown().optional()}).passthrough()),confidence:z.string(),evidenceScope:z.string()}).passthrough();
const caseSchema=z.object({caseId:z.string().min(1),caseVersion:z.number().int().positive(),saintId:z.string().nullable(),sourceObservationIds:z.array(z.string()),sourceRows:z.array(z.number().int().positive()),sourceSnapshotHash:z.string().regex(/^[a-f0-9]{64}$/),displayName:z.string(),question:z.string(),sourceDisplay:z.object({vitrine:z.string(),position:z.string(),rawName:z.string(),rawPlace:z.string(),relic:z.string(),packaging:z.string()}).passthrough(),options:z.array(optionSchema),uncertainty:z.string(),currentStatePreconditions:z.object({currentSection:z.string().nullable(),proposalRevision:z.string().nullable(),saintVersion:z.number().nullable(),existingFamilyKey:z.string().nullable(),sourceStatus:z.string()}).passthrough()}).passthrough();
const manifestSchema=z.object({manifestId:z.string(),manifestVersion:z.number().int().positive(),museumId:z.literal("museum-vrindavan"),sourceSnapshotHash:z.string().regex(/^[a-f0-9]{64}$/),cases:z.array(caseSchema)}).passthrough();
export const museumCuratorReviewManifest=manifestSchema.parse(raw);
export type MuseumCuratorManifestCase=z.infer<typeof caseSchema>;
export type MuseumCuratorManifestOption=z.infer<typeof optionSchema>;
if(new Set(museumCuratorReviewManifest.cases.map(c=>c.caseId)).size!==museumCuratorReviewManifest.cases.length)throw Error("Duplicate curator review case.");
for(const c of museumCuratorReviewManifest.cases)if(new Set(c.options.map(o=>o.optionId)).size!==c.options.length)throw Error("Duplicate curator review option.");

// A research recommendation is not sufficient by itself. Only an explicit,
// evidence-backed curator identity choice with no additional research gate can
// enable the precise museum-local effect reviewed in this manifest.
export function museumCuratorOptionBlockedReason(c:MuseumCuratorManifestCase,o:MuseumCuratorManifestOption):string|undefined {
 if(o.readiness!=="ready_after_confirmation"||o.additionalConditions.length)return "This choice needs further evidence or a reviewed family decision before it can update the museum proposal.";
 if(o.proposedChanges.some(v=>v.field!=="museumProposal.section"))return "Resolve the source identity in reconciliation first. This review only updates an already-linked saint’s subsection.";
 if(!c.saintId||o.targetSaintIds.length!==1||o.targetSaintIds[0]!==c.saintId)return "The exact website saint must be resolved before this choice can update the proposal.";
 if(o.proposedChanges.length!==1||o.proposedChanges[0].field!=="museumProposal.section"||o.proposedChanges[0].fromValue!==c.currentStatePreconditions.currentSection||o.proposedChanges[0].toValue!==o.proposedSection)return "The reviewed change does not match the exact current subsection and proposed destination; refresh this research case.";
 if(!o.proposedSection||!o.sources.length||o.sources.some(url=>!safeMuseumReviewUrl(url)))return "The proposed subsection or supporting source needs review.";
 return undefined;
}
export type MuseumCuratorBaseline={saintId:string;saintVersion:number;section:string;familyKey:string;sourceSnapshotHash:string|null;sourceRows:number[];hasCuratorOverride:boolean};
export function museumCuratorBaselineIssues(c:MuseumCuratorManifestCase,current:MuseumCuratorBaseline):string[] {
 const p=c.currentStatePreconditions,issues:string[]=[];
 if(c.saintId!==current.saintId)issues.push("The website identity changed since this case was prepared.");
 if(c.sourceSnapshotHash!==current.sourceSnapshotHash||!c.sourceRows.every(row=>current.sourceRows.includes(row)))issues.push("The source inventory or identity links changed; refresh this research case.");
 if(p.saintVersion!==current.saintVersion)issues.push("The website record changed since this case was prepared.");
 if(p.currentSection!==current.section||p.existingFamilyKey!==current.familyKey)issues.push("The museum subsection or display family changed; preserve the current decision and review this case again.");
 if(current.hasCuratorOverride)issues.push("An explicit curator proposal is already saved; review it through the existing proposal controls.");
 return issues;
}

export type MuseumCuratorCaseState={baseline:MuseumCuratorBaseline|null;revisionInput:unknown;latestReview?:{decision:"confirm_supported"|"different"|"unsure";note?:string}|null};
export function buildCuratorReviewCase(c:MuseumCuratorManifestCase,state:MuseumCuratorCaseState):{reviewCase:CuratorReviewCase;allowedPlans:Record<string,{saintId:string;section:string}>} {
 const issues=state.baseline?museumCuratorBaselineIssues(c,state.baseline):["The source identity must be resolved in the source review before this museum proposal can be confirmed."];
 const allowedPlans:Record<string,{saintId:string;section:string}>=Object.create(null);
 const options=c.options.map(o=>{
  const unavailableReason=issues[0]||museumCuratorOptionBlockedReason(c,o);
  if(!unavailableReason)allowedPlans[o.optionId]={saintId:c.saintId!,section:o.proposedSection!};
  return {id:o.optionId,label:o.label,description:o.evidenceScope,requiresIdentityLink:o.proposedChanges.some(v=>v.field==="sourceIdentity"),changes:o.proposedChanges.map(v=>({field:v.field==="museumProposal.section"?"Museum subsection":v.field,before:String(v.fromValue??"Not assigned"),after:String(v.toValue??o.proposedSection??"Requires review")})),...(unavailableReason?{unavailableReason}:{})};
 });
 const evidence=[...new Set(c.options.flatMap(o=>o.sources))].flatMap(url=>{const safe=safeMuseumReviewUrl(url);return safe?[{label:new URL(safe,"https://hindusaints.org").hostname,url:safe}]:[];});
 const revision=createHash("sha256").update(stableCollectionJson(JSON.parse(JSON.stringify({manifestId:museumCuratorReviewManifest.manifestId,manifestVersion:museumCuratorReviewManifest.manifestVersion,case:c,state})))).digest("hex");
 const resolved=state.latestReview?.decision==="confirm_supported";
 const decision=state.latestReview?.decision;
 const status=resolved?"resolved":decision==="different"||decision==="unsure"?decision:(!Object.keys(allowedPlans).length?"blocked":"pending");
 return {reviewCase:{caseId:c.caseId,revision,title:c.displayName,question:c.question,uncertainty:c.uncertainty,sourceDetails:{name:c.sourceDisplay.rawName,place:c.sourceDisplay.rawPlace,relic:c.sourceDisplay.relic},status,note:state.latestReview?.note,blockedReason:!resolved&&!Object.keys(allowedPlans).length?(issues[0]||options.find(o=>o.unavailableReason)?.unavailableReason):undefined,sourceLabel:"Source inventory rows: "+c.sourceRows.join(", "),locationLabel:"Source inventory location (not verified current placement): "+[c.sourceDisplay.vitrine&&"Vitrine "+c.sourceDisplay.vitrine,c.sourceDisplay.position&&"Position "+c.sourceDisplay.position].filter(Boolean).join(" / "),evidence,options,...(c.saintId?{saintId:c.saintId,portraitContext:"website_candidate" as const}:{})},allowedPlans};
}
