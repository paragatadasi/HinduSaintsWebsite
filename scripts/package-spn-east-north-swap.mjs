import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>JSON.parse(readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const path=process.argv[2];
if(!path)throw new Error('Provide the approved East–North swap handoff');
const handoff=read(path),manifest=read(path.replace('-handoff.json','-manifest.json'));
for(const file of manifest.files)if(createHash('sha256').update(readFileSync(file.path)).digest('hex')!==file.sha256)throw new Error(`Manifest mismatch: ${file.path}`);
const proposalPath='data/museum/spn-room-proposal-vraj-girnar-v1.json',designPath='data/museum/spn-room-explorer-vraj-girnar-v1-design.json';
const proposal=read(proposalPath),design=read(designPath),research=read(handoff.files.layout),holdings=read(handoff.files.sourceAllocations);
const option=design.options[0],approved=research.options.find(o=>o.id===research.activeOptionId)??research.options[0];
const amendment='east-north-26-37-2026-10-26';
if(proposal.amendments?.some(a=>a.id===amendment))throw new Error('Swap amendment already applied');
const swap=n=>String(n)==='26'?(typeof n==='number'?37:'37'):String(n)==='37'?(typeof n==='number'?26:'26'):n;
const allocations=new Map(holdings.sourceObservationAssignments.map(r=>[r.sourceRecordId,r]));
let changes=0;
for(const row of proposal.rows){
 const expected=allocations.get(row.sourceId);
 if(!expected||expected.canonicalId!==row.saintId||expected.observedShelfShare!==row.share)throw new Error(`Changed source evidence: ${row.sourceId}`);
 const destination=swap(row.vitrine);
 // The existing co-location reader independently applies the accepted Sankaranya correction.
 if(row.sourceId!=='rec7cV8OOW6dYau1K'&&String(expected.vitrine)!==destination)throw new Error(`Unexpected destination: ${row.sourceId}`);
 if(destination!==row.vitrine){row.vitrine=destination;changes++;}
}
if(changes!==34||proposal.rows.length!==1423)throw new Error('Unexpected scope for the approved swap');
const replaceCases=(rows,approvedRows,key)=>rows.map(row=>['26','37'].includes(String(row[key]))?structuredClone(approvedRows.find(r=>String(r[key])===String(row[key]))):row);
proposal.assignments=replaceCases(proposal.assignments,approved.assignments,'number');
option.assignments=replaceCases(option.assignments,approved.assignments,'number');
proposal.indicators=replaceCases(proposal.indicators,handoff.vitrines,'vitrine');
const oldConnection='Modern Gaudiya mission ↔ Puri → Gosaiji and Yogmaya';
const driver=structuredClone(approved.drivers.find(d=>d.connection==='Gaudiya / Vraj → Gosaiji and Yogmaya → Puri'));
if(!driver)throw new Error('Missing reviewed adjacency explanation');
driver.reason='The modern Gaudiya / Vraj endcap in 38 faces Gosaiji and Yogmaya’s intact family in 37 across the aisle. Their Vraj and Puri life connections bridge into the Puri display in 26, immediately along the same face. Shared adjacency does not create a new guru relationship.';
for(const host of [proposal,option])host.drivers=host.drivers.map(d=>d.connection===oldConnection?driver:d);
for(const packet of option.displayPackets)packet.cases=packet.cases.map(swap);
for(const list of [design.placements,option.primaryAssignments,option.secondaryAssignments,option.sourceOnlyPrimaryAssignments,option.sourceOnlySecondaryAssignments,option.companionRecommendations])for(const p of list??[]){p.vitrine=swap(p.vitrine);if(p.caseOptions)p.caseOptions=p.caseOptions.map(swap);}
for(const key of ['primaryPackets','caseAnchorRecommendations'])for(const n of ['26','37'])option[key][n]=structuredClone(approved[key][n]);
option.caseSpaceLedger=replaceCases(option.caseSpaceLedger,approved.caseSpaceLedger,'vitrine');
option.summary='Mirabai and the early Gaudiyas share Vitrine 2. The modern Gaudiya mission in 38 faces Gosaiji and Yogmaya’s family in 37, continuing to Puri in 26. Girnar / Nath displays meet the North. The Rama continuation in 79 remains open for refinement.';
const provenance=[path,handoff.files.layout,handoff.files.sourceAllocations].map(file=>({file:file.split(/[\\/]/).pop(),sha256:createHash('sha256').update(readFileSync(file)).digest('hex')}));
proposal.amendments=[...(proposal.amendments??[]),{id:amendment,sourceVersion:handoff.proposalVersion,changedSourceObservations:changes,description:'Approved full-group exchange: Gosaiji / Yogmaya to 37, Jagannath / Puri to 26. All other destinations and live curator overrides retained.',provenance}];
writeFileSync(proposalPath,JSON.stringify(proposal));writeFileSync(designPath,JSON.stringify(design));
console.log(`Applied ${changes} source-observation destination changes; original option identity and default selection retained.`);
