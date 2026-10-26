import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>JSON.parse(readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const path=process.argv[2];
if(!path)throw new Error('Provide the approved North continuity handoff');
const handoff=read(path),manifest=read(path.replace('-handoff.json','-manifest.json'));
for(const file of manifest.files)if(createHash('sha256').update(readFileSync(file.path)).digest('hex')!==file.sha256)throw new Error(`Manifest mismatch: ${file.path}`);
const proposalPath='data/museum/spn-room-proposal-vraj-girnar-v1.json',designPath='data/museum/spn-room-explorer-vraj-girnar-v1-design.json';
const proposal=read(proposalPath),design=read(designPath),research=read(handoff.files.layout),holdings=read(handoff.files.sourceAllocations);
const option=design.options[0],approved=research.options.find(o=>o.id===research.activeOptionId)??research.options[0];
const amendment='east-north-haidakhan-22-2026-10-26';
if(proposal.amendments?.some(a=>a.id===amendment))throw new Error('North continuity amendment already applied');
if(proposal.rows.some(r=>r.vitrine==='22'))throw new Error('Vitrine 22 is no longer empty in the proposal');
const case22=proposal.layout.vitrines.find(v=>v.number==='22');
if(case22?.availability!=='existing'||case22.restriction!=='general')throw new Error('Vitrine 22 requires a new restriction review');
const move=n=>String(n)==='70'?(typeof n==='number'?22:'22'):n;
const allocations=new Map(holdings.sourceObservationAssignments.map(r=>[r.sourceRecordId,r]));
let changes=0;
for(const row of proposal.rows){
 const expected=allocations.get(row.sourceId);
 if(!expected||expected.canonicalId!==row.saintId||expected.observedShelfShare!==row.share)throw new Error(`Changed source evidence: ${row.sourceId}`);
 const destination=move(row.vitrine);
 if(row.sourceId!=='rec7cV8OOW6dYau1K'&&String(expected.vitrine)!==destination)throw new Error(`Unexpected destination: ${row.sourceId}`);
 if(destination!==row.vitrine){row.vitrine=destination;changes++;}
}
if(changes!==23||proposal.rows.length!==1423)throw new Error('Unexpected scope for North continuity');
const cases=['22','23','70'];
const replaceCases=(rows,approvedRows,key)=>rows.map(row=>cases.includes(String(row[key]))?structuredClone(approvedRows.find(r=>String(r[key])===String(row[key]))):row);
proposal.assignments=replaceCases(proposal.assignments,approved.assignments,'number');
option.assignments=replaceCases(option.assignments,approved.assignments,'number');
proposal.indicators=replaceCases(proposal.indicators,handoff.vitrines,'vitrine');
proposal.indicators.find(i=>i.vitrine==='23').specialFitNote="Use Vitrine 23 only after its existing full-height objects have suitable, verified housing in 64 and 69.";
const driver=structuredClone(approved.drivers.find(d=>d.connection==='Gorakhpur–Girnar / Nath boundary'));
if(!driver)throw new Error('Missing reviewed North adjacency explanation');
driver.reason='The western Girnar / Nath boundary remains beside the northern neighborhood. Haidakhan’s complete group is now with the North in 22; 70 is potential spillover rather than a separate planned family.';
for(const host of [proposal,option])host.drivers=host.drivers.map(d=>d.connection===driver.connection?driver:d);
for(const packet of option.displayPackets)packet.cases=packet.cases.map(move);
for(const list of [design.placements,option.primaryAssignments,option.secondaryAssignments,option.sourceOnlyPrimaryAssignments,option.sourceOnlySecondaryAssignments,option.companionRecommendations])for(const p of list??[]){p.vitrine=move(p.vitrine);if(p.caseOptions)p.caseOptions=p.caseOptions.map(move);}
for(const key of ['primaryPackets','caseAnchorRecommendations'])for(const n of cases)option[key][n]=structuredClone(approved[key][n]);
option.caseSpaceLedger=replaceCases(option.caseSpaceLedger,approved.caseSpaceLedger,'vitrine');
option.largeObjects.fallback='If 64 is unsuitable, hold reuse of 23 until a suitable full-height destination is confirmed.';
option.summary+=' Haidakhan’s group joins the northern neighborhood in 22; provisional 70 is kept as potential spillover space.';
const provenance=[path,handoff.files.layout,handoff.files.sourceAllocations].map(file=>({file:file.split(/[\\/]/).pop(),sha256:createHash('sha256').update(readFileSync(file)).digest('hex')}));
proposal.amendments.push({id:amendment,sourceVersion:handoff.proposalVersion,changedSourceObservations:changes,description:'Haidakhan and northern companions move from proposed 70 to 22. Provisional 70 remains unallocated potential spillover; full-height clearance belongs to 23. Physical fit remains unverified.',provenance});
writeFileSync(proposalPath,JSON.stringify(proposal));writeFileSync(designPath,JSON.stringify(design));
console.log(`Applied ${changes} proposed destination changes; physical layout metadata and all other destinations retained.`);
