import {allOperationalSpnShelves as packet} from "./spn-operational-shelves";
import {currentSpnProposalRelease} from "./spn-current-proposal";
import {projectShelfPlanningContext,type ShelfPlanningContext} from "./museum-shelf-planning-context";
import {MuseumMoveSessionError} from "./museum-move-session-domain";
import {readSharedMuseumCompanionRevision,readSharedMuseumCompanionSnapshot,type MuseumCompanionReadSnapshot} from "./museum-companion-read-snapshot";
import {companionResourceRevision} from "./museum-companion-read-revision";

const availableVitrines=packet.vitrines.map(row=>row.code);
const validVitrines=new Set(currentSpnProposalRelease.proposal.layout.vitrines.map(row=>row.number));
type ShelfResponse=ShelfPlanningContext&{revision:string;availableVitrines:string[]};
const contexts=new WeakMap<MuseumCompanionReadSnapshot,Map<string,ShelfResponse>>();
export async function readCompanionShelfPlans(options:{vitrine?:string;knownRevisions?:string[]}={}){
 if(options.vitrine&&!validVitrines.has(options.vitrine))throw new MuseumMoveSessionError(400,"Choose a vitrine in this museum's layout.");
 const scope=`shelves:${packet.version}:${options.vitrine??"all"}`;
 const known=options.knownRevisions??[];
 const revision=await readSharedMuseumCompanionRevision();
 const tag=companionResourceRevision(revision,scope);
 if(known.includes(tag))return {changed:false as const,revision:tag};
 const snapshot=await readSharedMuseumCompanionSnapshot(revision);
 const actualTag=companionResourceRevision(snapshot.revision,scope);
 if(known.includes(actualTag))return {changed:false as const,revision:actualTag};
 let byCase=contexts.get(snapshot);if(!byCase){byCase=new Map();contexts.set(snapshot,byCase);}
 let data=byCase.get(scope);
 if(!data){
  const selected=options.vitrine?{...packet,vitrines:packet.vitrines.filter(row=>row.code===options.vitrine)}:packet;
  data={...projectShelfPlanningContext(selected,{current:snapshot.current,physical:snapshot.physical,alternatives:snapshot.alternatives,additions:snapshot.valid,review:{rows:snapshot.shelfReview.rows,pendingPlacements:snapshot.shelfReview.proposal.pendingPlacements}}),revision:snapshot.revision,availableVitrines};
  byCase.set(scope,data);
 }
 return {changed:true as const,revision:actualTag,data};
}
