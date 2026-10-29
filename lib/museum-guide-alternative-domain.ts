import {MuseumMoveSessionError} from "./museum-move-session-domain";
import type {GuideDefinition,RegisteredSuggestion} from "./spn-starter-guide-registry";
const scope=(value:RegisteredSuggestion)=>JSON.stringify([value.kind,value.targetVitrine,[...value.sourceIds].sort()]);
export function assertAlternativeGuideContext(active:GuideDefinition,owner:GuideDefinition,suggestionId:string){
 const suggestion=owner.suggestions.find(s=>s.id===suggestionId);
 const same=active.context.guideVersion===owner.context.guideVersion;
 const inherited=active.previousVersions?.includes(owner.context.guideVersion);
 if(active.readOnly||!suggestion||(!same&&!inherited)||!active.suggestions.some(s=>scope(s)===scope(suggestion)))
  throw new MuseumMoveSessionError(409,"Open the alternative's current phase before recording this move.");
 return suggestion;
}
