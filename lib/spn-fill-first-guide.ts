import {spnFillFirstTransfers} from './museum-preparatory-transfers';
import {createHash} from 'node:crypto';
import packet from '../data/museum/spn-fill-first-guide-v1.json';
import {gosaijiSaiGuideContext} from './spn-gosaiji-sai-guide';
import {projectScopedMoveGuide} from './spn-datta-guide';
import {spnMovementBlockedReason} from './spn-movement-holds';
import type {GuideDefinition} from './spn-starter-guide-registry';
import type {StarterMoveGuide,PhysicalState} from './spn-move-guide';

function canonical(value:unknown):string {
  if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;
  if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical((value as Record<string,unknown>)[key])}`).join(',')}}`;
  return JSON.stringify(value)??'null';
}
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
const {contentDigest:_,...content}=packet;
const pairs=packet.rows.map(row=>[row.sourceId,row.destination]).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
const members=packet.groups.flatMap(group=>group.sourceIds);
if(hash(canonical(content))!==packet.contentDigest||hash(JSON.stringify(pairs))!==packet.assignmentDigest||packet.rows.length!==50||new Set(members).size!==50||members.length!==50||
  packet.groups.some(group=>group.sourceIds.some(id=>!packet.rows.some(row=>row.sourceId===id&&row.destination===group.vitrine))||group.edges.some(edge=>!group.sourceIds.includes(edge.fromSourceId)||!group.sourceIds.includes(edge.toSourceId))))throw new Error('The approved fill-first guide changed.');

export const fillFirstGuideContext={guideVersion:packet.version,contentDigest:packet.contentDigest,assignmentDigest:packet.assignmentDigest};
export const fillFirstGuideDefinition:GuideDefinition={context:fillFirstGuideContext,previousVersions:[gosaijiSaiGuideContext.guideVersion],
  suggestions:[...packet.groups.map(group=>({id:group.id,kind:group.kind==='city'?'city' as const:'family' as const,sourceIds:group.sourceIds,targetVitrine:group.vitrine})),...packet.rows.map(row=>({id:`row:${row.sourceId}`,kind:'row' as const,sourceIds:[row.sourceId],targetVitrine:row.destination}))],
  physicalScope:{allowClear:false,preparatoryTransfers:spnFillFirstTransfers,preparationVitrines:['75','23','73'],destinations:Object.fromEntries([...pairs,...spnFillFirstTransfers.map(t=>[t.sourceId,t.toVitrine])])}};
export const fillFirstMoveGuide:StarterMoveGuide={
  version:packet.version,contentDigest:packet.contentDigest,assignmentDigest:packet.assignmentDigest,proposalVersion:packet.proposalVersion,
  title:packet.title,proposalLabel:packet.proposalLabel,phaseLabel:'Fill first · 75, 23 & 73',allowClear:false,preparationVitrines:['75','23','73'],
  preparatoryTransfers:[{sourceId:'rec6IqZR7ahPTDfEI',name:'Hanuman Das · spade',fromVitrine:'23',toVitrine:'70',finalDestination:'70',requiredBefore:['23']},{sourceId:'recMo8X6ehasAq0cW',name:'Baba Harbhajan Singh · uniform',fromVitrine:'23',toVitrine:'70',finalDestination:'18',requiredBefore:['23']}],
  entries:packet.rows.map(row=>({...row,movementBlockedReason:spnMovementBlockedReason(row.sourceId)})),
  vitrines:(['75','23','73'] as const).map(code=>({code,
    summary:`${packet.rows.filter(r=>r.destination===code).length} inventory entries · estimated ${packet.space[code].known.toFixed(2)} / 5 shelf-height spaces${packet.space[code].unknown?` + ${packet.space[code].unknown} sizes to check`:''}.`,
    families:packet.groups.filter(g=>g.vitrine===code&&g.kind==='family').map(g=>({...g,suggestedVitrines:[code]})),
    cityGroups:packet.groups.filter(g=>g.vitrine===code&&g.kind==='city').map(g=>({...g,suggestedVitrines:[code]}))})),
  alternatives:[],reportedPlacements:[]
};
export function projectFillFirstGuide(current:Parameters<typeof projectScopedMoveGuide>[1],physical:PhysicalState){return projectScopedMoveGuide(fillFirstMoveGuide,current,physical);}
