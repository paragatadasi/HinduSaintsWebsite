import {starterGuideContext as v6Context,starterGuideDefinition as v6Definition} from "./spn-starter-guide-v6";
import {registeredStarterGuide,starterGuideContext,starterGuideDefinition} from "./spn-starter-guide-v7";
import {readStarterGuideDefinition as readV5,starterGuideContext as v5Context} from "./spn-starter-guide-v5";
export {registeredStarterGuide,starterGuideContext};
import {approvedHingeGuide} from "./spn-approved-hinge-guide";
import {maharashtraReceivingGuide} from "./spn-maharashtra-receiving-guide";
import {eastRemainderGuideContext as priorEastContext,eastRemainderGuideDefinition as priorEastDefinition} from "./spn-east-remainder-guide-v1";
import {hingeAdditionsGuideContext,hingeAdditionsGuideDefinition} from "./spn-hinge-additions-guide";
import {southernGuideContext as oldSouthernContext,southernGuideDefinition as oldSouthernDefinition} from "./spn-southern-guide-v1";
import {west40To44GuideContext as oldWestContext,west40To44GuideDefinition as oldWestDefinition} from "./spn-west40-44-guide-v1";
import {westV59GuideContext,westV59GuideDefinition} from "./spn-west-v59-guide";
import {southernGuideContext,southernGuideDefinition} from "./spn-southern-guide";
import {west40To44GuideContext,west40To44GuideDefinition} from "./spn-west40-44-guide";
import {junagadhGuideContext,junagadhGuideDefinition} from "./spn-junagadh-guide";
import {westV47GuideContext,westV47GuideDefinition} from "./spn-west-v47-guide";
import {westV46GuideContext,westV46GuideDefinition} from "./spn-west-v46-guide";
import {vrajStoryTopsGuideContext,vrajStoryTopsGuideDefinition} from "./spn-vraj-story-tops-guide";
import {westV45GuideContext,westV45GuideDefinition} from "./spn-west-v45-guide";
import {westV1GuideContext,westV1GuideDefinition} from "./spn-west-v1-guide";
import {eastRemainderGuideContext,eastRemainderGuideDefinition} from "./spn-east-remainder-guide";
import {northernGuideContext as priorNorthernContext,northernGuideDefinition as priorNorthernDefinition} from "./spn-northern-guide-v1";
import {northernGuideContext,northernGuideDefinition} from "./spn-northern-guide";
import {ramakrishnaGuideContext,ramakrishnaGuideDefinition} from "./spn-ramakrishna-guide";
import {fillFirstGuideContext, fillFirstGuideDefinition} from "./spn-fill-first-guide";
import {vrajGuideContext, vrajGuideDefinition} from "./spn-vraj-guide";
import {vrajRemainderGuideContext,vrajRemainderGuideDefinition} from "./spn-vraj-remainder-guide";
import { gosaijiSaiGuideContext, gosaijiSaiGuideDefinition } from "./spn-gosaiji-sai-guide";
import { readStarterGuideDefinition as readV4, starterGuideContext as v4Context } from "./spn-starter-guide-v4";
import { ramBhaktiGuideContext, ramBhaktiGuideDefinition } from "./spn-ram-bhakti-guide";
import { dattaGuideContext, dattaGuideDefinition } from "./spn-datta-guide";
import { readStarterGuideDefinition as readV3, starterGuideContext as v3Context } from "./spn-starter-guide-v3";
import { readStarterGuideDefinition as readV2, starterGuideContext as v2Context } from "./spn-starter-guide-v2";
import { MuseumMoveSessionError } from "./museum-move-session-domain";

export type GuideContext = { guideVersion: string; contentDigest: string; assignmentDigest: string };
export type RegisteredSuggestion = { id: string; kind: "family" | "city" | "row" | "alternative"; sourceIds: string[]; targetVitrine: string };
export type GuideDefinition = { context: GuideContext; suggestions: RegisteredSuggestion[]; previousVersions?: string[]; readOnly?: boolean; physicalScope?: { allowClear: boolean; clearVitrines?: string[]; clearanceRequiredDestinations?: string[]; clearancePerDestination?: boolean; preparationVitrines?: string[]; previousClearanceVersions?: string[]; preparatoryTransfers?: import("./museum-preparatory-transfers").PreparatoryTransfer[]; destinations: Record<string, string> } };
export function currentReceiverGuideDefinitions(vitrine: string): GuideDefinition[] {
  return [maharashtraReceivingGuide.context,approvedHingeGuide.context,southernGuideContext,west40To44GuideContext,junagadhGuideContext,westV59GuideContext,westV46GuideContext,westV45GuideContext,westV1GuideContext,eastRemainderGuideContext,northernGuideContext,ramakrishnaGuideContext, vrajGuideContext,vrajRemainderGuideContext,vrajStoryTopsGuideContext,
    ramBhaktiGuideContext, dattaGuideContext, starterGuideContext].map(context => readStarterGuideDefinition(context.guideVersion))
    .filter(definition => !definition.readOnly && (definition.suggestions.some(row => row.targetVitrine === vitrine) ||
      Object.values(definition.physicalScope?.destinations ?? {}).includes(vitrine)));
}
export function readStarterGuideDefinition(version: string): GuideDefinition {
  if(version===v6Context.guideVersion)return {...v6Definition,readOnly:true};
  if(version===v5Context.guideVersion)return {...readV5(version),readOnly:true};
  if(version===maharashtraReceivingGuide.context.guideVersion)return maharashtraReceivingGuide.definition;
  if(version===approvedHingeGuide.context.guideVersion)return approvedHingeGuide.definition;
  if(version===hingeAdditionsGuideContext.guideVersion)return {...hingeAdditionsGuideDefinition,readOnly:true};
  if(version===oldSouthernContext.guideVersion)return {...oldSouthernDefinition,readOnly:true};
  if(version===southernGuideContext.guideVersion)return southernGuideDefinition;
  if(version===oldWestContext.guideVersion)return {...oldWestDefinition,readOnly:true};
  if(version===west40To44GuideContext.guideVersion)return west40To44GuideDefinition;
  if(version===junagadhGuideContext.guideVersion)return junagadhGuideDefinition;
  if(version===westV59GuideContext.guideVersion)return westV59GuideDefinition;
  if(version===westV47GuideContext.guideVersion)return {...westV47GuideDefinition,readOnly:true};
  if(version===westV46GuideContext.guideVersion)return westV46GuideDefinition;
  if(version===westV45GuideContext.guideVersion)return westV45GuideDefinition;
  if(version===westV1GuideContext.guideVersion)return westV1GuideDefinition;
  if(version===eastRemainderGuideContext.guideVersion)return eastRemainderGuideDefinition;
  if(version===priorEastContext.guideVersion)return {...priorEastDefinition,readOnly:true};
  if(version===vrajStoryTopsGuideContext.guideVersion)return vrajStoryTopsGuideDefinition;
  if(version===vrajRemainderGuideContext.guideVersion)return {...vrajRemainderGuideDefinition,readOnly:true};
  if(version===northernGuideContext.guideVersion)return northernGuideDefinition;
  if(version===priorNorthernContext.guideVersion)return {...priorNorthernDefinition,readOnly:true};
  if (version === ramakrishnaGuideContext.guideVersion) return ramakrishnaGuideDefinition;
  if (version === fillFirstGuideContext.guideVersion) return fillFirstGuideDefinition;
  if (version === vrajGuideContext.guideVersion) return vrajGuideDefinition;
  if (version === gosaijiSaiGuideContext.guideVersion) return gosaijiSaiGuideDefinition;
  if (version === ramBhaktiGuideContext.guideVersion) return ramBhaktiGuideDefinition;
  if (version === dattaGuideContext.guideVersion) return dattaGuideDefinition;
  if (version === v4Context.guideVersion) return { ...readV4(version), readOnly: true };
  if (version === v3Context.guideVersion) return { ...readV3(version), readOnly: true };
  if (version === v2Context.guideVersion) return { ...readV2(version), readOnly: true };
  if (version !== starterGuideContext.guideVersion) throw new MuseumMoveSessionError(409, "This guide version is not registered. Reload the guide before changing a suggestion.");
  return starterGuideDefinition;
}
