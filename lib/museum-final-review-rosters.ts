import {projectResolvedRosters} from "./museum-confirmed-rosters";
import {isCountedSpnProgressSource} from "./spn-progress-exclusions";
import type {FinalReviewProposal} from "./museum-final-review-domain";
import type {CompanionRow,GuideEntry,StarterMoveGuide} from "./spn-move-guide";

export function projectFinalReviewRosters<T extends string>(guides:Record<T,StarterMoveGuide>,proposals:FinalReviewProposal[],catalog:GuideEntry[],rows:CompanionRow[]){
  const entries=new Map(catalog.map(entry=>[entry.sourceId,entry]));
  const current=new Map(rows.map(row=>[row.sourceId,row]));
  const resolved=proposals.flatMap(proposal=>{
    const entry=entries.get(proposal.sourceId),row=current.get(proposal.sourceId);
    if(!entry||!row||row.identityChanged||row.sourceRevision!==proposal.sourceRevision||row.saintId!==proposal.saintId||entry.saintId!==proposal.saintId||!isCountedSpnProgressSource(proposal.sourceId))return [];
    return [{entry:{...entry,componentScope:proposal.componentScope,destination:proposal.vitrine,allocationPending:null,proposalTransfer:null},code:proposal.vitrine}];
  });
  return projectResolvedRosters(guides,resolved,"final-review","Final review");
}
