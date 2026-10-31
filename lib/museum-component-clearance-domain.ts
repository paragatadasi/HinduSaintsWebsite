import { z } from "zod";
import { MuseumMoveSessionError, type MoveLocation } from "./museum-move-session-domain";
import {isReviewedParamanandArmSupport} from "./spn-paramanand-reviewed-object";

export const v20ComponentSourceIds = ["rec9vEn5oj7QZTXl0", "recVN6Ty3682Uz2g4"] as const;
export const isV20ComponentSourceId = (sourceId: string) => v20ComponentSourceIds.some(id => id === sourceId);
export const v19ComponentBinding={sourceId:"rec7GxgNvmubmTvMM",saintId:"cms0w7d9s01cb07qil8lvv2z0",sourceRevision:"8f4127e3ad3fd2150a20e59caf8f7d9893276c046b506857ebd11161683155fc"};
export const v42ComponentBinding={sourceId:"reck86EKve5tFAi6R",saintId:"cms0w7g3504zx07qigfcnvy6p",sourceRevision:"83a1a528d50d3f12c34f49b1582ae4cfcaa060e0fb97c962c6b48f5281435e33"};
export const v64ComponentBinding={sourceId:"recsm43oeUdKNUMqs",saintId:"cms0w7i3s07f307qiuaezle9f",sourceRevision:"4aa5af436e0b66276924c3731632d93eb9ead023178f915737a17179123f4329"};
export const componentSourceIds=[...v20ComponentSourceIds,v19ComponentBinding.sourceId,v42ComponentBinding.sourceId,v64ComponentBinding.sourceId];
export type ComponentScope="vitrine_20_contents_only"|"vitrine_19_contents_only"|"vitrine_42_contents_only"|"vitrine_64_contents_including_sticks";
export function componentOriginCode(sourceId:string):"19"|"20"|"42"|"64"|null {
  return sourceId===v19ComponentBinding.sourceId?"19":sourceId===v42ComponentBinding.sourceId?"42":sourceId===v64ComponentBinding.sourceId?"64":isV20ComponentSourceId(sourceId)?"20":null;
}
export function componentScopeForOrigin(code:string):ComponentScope|null {
  return code==="19"?"vitrine_19_contents_only":code==="20"?"vitrine_20_contents_only":code==="42"?"vitrine_42_contents_only":code==="64"?"vitrine_64_contents_including_sticks":null;
}
const originOnlyAcknowledgement=z.object({
  sourceId: z.string().refine(id=>componentSourceIds.includes(id)), scope: z.enum(["vitrine_20_contents_only","vitrine_19_contents_only","vitrine_42_contents_only"]),
  allOriginPiecesStaged: z.literal(true), walkingSticksNotInVitrine: z.literal(true)
}).strict();
const includingSticksAcknowledgement=z.object({sourceId:z.string().refine(id=>id===v64ComponentBinding.sourceId),scope:z.literal("vitrine_64_contents_including_sticks"),allOriginPiecesStaged:z.literal(true),walkingSticksInVitrineStaged:z.literal(true)}).strict();
export const componentStagingAcknowledgements=z.array(z.union([originOnlyAcknowledgement,includingSticksAcknowledgement]).refine(row=>row.scope===componentScopeForOrigin(componentOriginCode(row.sourceId)??""),"Component source and origin do not match.")).max(5).refine(rows=>new Set(rows.map(row=>row.sourceId)).size===rows.length,"Repeated component acknowledgement.");
export type ComponentPlacement = {
  sourceId: string; receiptId: string; recordedAt: string; revision: string;
  origin: MoveLocation; location: MoveLocation; scope: ComponentScope;
  excludedWalkingSticks: { location: null; status: "unverified" };
  includedWalkingSticks?:true;
  expectedSourceRevision: string; previousCurrentRevision: string; previousLocationVersion: number;
};
export type ComponentClearanceInput = {
  clearedVitrines?: string[]; initialCaseClearAcknowledged?: true;
  componentStagingAcknowledgements?: z.infer<typeof componentStagingAcknowledgements>;
  retainedCaseClearanceAcknowledgement?:{vitrine:"64";allOriginPiecesIncludingWalkingSticksStaged:true};
  records: { sourceId: string; to: MoveLocation }[];
};

export function assertComponentClearanceScope(input: ComponentClearanceInput) {
  const acknowledgements = input.componentStagingAcknowledgements ?? [];
  if (!acknowledgements.length) return;
  if (input.clearedVitrines?.length !== 1 || !input.initialCaseClearAcknowledged)
    throw new MuseumMoveSessionError(400, "Component confirmations apply only to the acknowledged origin-vitrine clearing.");
  for (const ack of acknowledgements) {
    const origin=componentOriginCode(ack.sourceId);
    if(!origin||input.clearedVitrines[0]!==origin||ack.scope!==componentScopeForOrigin(origin))
      throw new MuseumMoveSessionError(400,"Component source and cleared vitrine do not match.");
    if(origin==="64"&&!input.retainedCaseClearanceAcknowledgement?.allOriginPiecesIncludingWalkingSticksStaged)
      throw new MuseumMoveSessionError(400,"Acknowledge the Vitrine 64 clearing including its walking sticks.");
    const record = input.records.find(row => row.sourceId === ack.sourceId);
    if (!record || record.to.kind !== "table" || record.to.code !== "staging-area")
      throw new MuseumMoveSessionError(400, "Confirm only the origin-vitrine pieces moved to staging.");
  }
}

type ComponentSource = {
  sourceId: string; current: Pick<MoveLocation,"kind"|"code"> | null; fixedHousing: boolean;
  verifiedItemIds: string[]; identityChanged: boolean;
  saintId?:string|null;sourceRevision?:string;housingEvidenceRevision?:string;
};
export function componentClearanceScope(row:ComponentSource):ComponentScope|null {
  const origin=componentOriginCode(row.sourceId);
  if(!origin||row.current?.kind!=="vitrine"||row.current.code!==origin||row.fixedHousing||row.verifiedItemIds.length||row.identityChanged)return null;
  const binding=origin==="19"?v19ComponentBinding:origin==="42"?v42ComponentBinding:origin==="64"?v64ComponentBinding:null;
  if(binding&&(row.saintId!==binding.saintId||row.sourceRevision!==binding.sourceRevision))return null;
  if(row.saintId!==undefined&&row.sourceRevision&&isReviewedParamanandArmSupport({...row,saintId:row.saintId,sourceRevision:row.sourceRevision}))return null;
  return componentScopeForOrigin(origin);
}
export function isComponentClearance(input: ComponentClearanceInput, row: ComponentSource) {
  const acknowledged = input.componentStagingAcknowledgements?.find(ack => ack.sourceId === row.sourceId);
  if (!acknowledged) return false;
  if(row.saintId!==undefined&&row.sourceRevision&&isReviewedParamanandArmSupport({...row,saintId:row.saintId,sourceRevision:row.sourceRevision}))
    throw new MuseumMoveSessionError(409,"This source is reviewed as one complete arm-support. Reload and record its ordinary whole-object location, not a partial component confirmation.");
  assertComponentClearanceScope(input);
  if (componentClearanceScope(row)!==acknowledged.scope)
    throw new MuseumMoveSessionError(409, "These components or their source changed. Review the clearing again.");
  return true;
}

export function projectComponentPlacement<T extends {
  currentVersion: number; currentRevision: string; sourceRevision?: string;
  current: MoveLocation | null; currentBasis: string; currentConfirmed?: unknown;
}>(row: T, component?: ComponentPlacement) {
  if (!component || row.currentVersion !== component.previousLocationVersion || row.currentRevision !== component.previousCurrentRevision ||
      (row.sourceRevision !== undefined && row.sourceRevision !== component.expectedSourceRevision))
    return { ...row, componentPlacement: null as ComponentPlacement | null };
  return { ...row, current: null, currentBasis: "unknown" as const, currentConfirmed: null,
    currentRevision: component.revision, componentPlacement: component };
}
