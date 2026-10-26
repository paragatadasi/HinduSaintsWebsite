import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>JSON.parse(readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const handoffPath=process.argv[2];
if(!handoffPath)throw new Error('Provide the completed Vraj and Girnar handoff');
const manifest=read(handoffPath.replace('-handoff.json','-manifest.json'));
for(const file of manifest.files){
 if(createHash('sha256').update(readFileSync(file.path)).digest('hex')!==file.sha256)throw new Error(`Manifest mismatch: ${file.path}`);
}
const handoff=read(handoffPath),layout=read(handoff.files.layout);
const output='data/museum/spn-room-proposal-vraj-girnar-v1.json';
execFileSync(process.execPath,['scripts/package-spn-explorer.mjs',handoffPath,handoff.freshDataBaseline.snapshotPath,output],{stdio:'inherit'});
const proposal=read(output),option=layout.options.find(o=>o.id===layout.activeOptionId);
const baseline=read('data/museum/spn-room-proposal-east-v2.json');
const design=read('data/museum/spn-room-explorer-east-v2-design.json');
const originalRows=new Map(baseline.rows.map(r=>[r.sourceId,r]));
for(const row of proposal.rows){
 const original=originalRows.get(row.sourceId);
 if(!original||original.saintId!==row.saintId||original.share!==row.share||row.vitrine!==String(handoff.recordOverrides[row.saintId]??handoff.casePermutation[original.vitrine]??original.vitrine))throw new Error(`Unexpected allocation: ${row.sourceId}`);
}
proposal.title=option.title;
proposal.reviewStatus='comparison-study';
proposal.reviewNote='Comparison study · The Rama continuation in Vitrine 79 remains open for refinement. Viewing this option does not apply a move plan.';
option.summary='Mirabai and the early Gaudiyas share Vitrine 2. The modern Gaudiya mission faces Puri at 38; Girnar / Nath displays meet the North. The Rama continuation in 79 remains open for refinement.';
const kinds=new Map(design.options[0].displayPackets.map(p=>[p.unitId,p.navigationKind]));
for(const packet of option.displayPackets){
 const kind=packet.navigationKind??kinds.get(packet.unitId);
 if(!['neighborhood','operational'].includes(kind))throw new Error(`Review navigation meaning: ${packet.unitId}`);
 packet.navigationKind=kind;
 if(packet.unitId==='rama')packet.label='Rama / Ramanandi continuation; Vitrine 79 remains for refinement';
}
option.primeAnchors['38']={people:'Bhaktivinoda Thakur · Bhaktisiddhanta Sarasvati · A. C. Bhaktivedanta Swami Prabhupada',reason:'Modern Gaudiya missions facing Puri. Bhaktivinoda’s father and mentor connection is distinct from Gaura Kishor’s initiation relationship.'};
for(const driver of option.drivers){
 driver.reason=driver.reason.replace(/([a-zA-Z])(?=\d)/g,'$1 ').replace(/(\d)(?=[a-zA-Z])/g,'$1 ').replace(/\.(?=\d)/g,'. ');
}
const heldCases=[...handoff.heldCases,{case:'Baman Goswami identity',status:'Exact identity under review',saintIds:['cms0w7exp03jl07qicixobts0'],destination:38,reason:'The source name has not been confirmed as Bhaktivedanta Vamana Goswami. His existing Primary tier is retained.'}];
writeFileSync(output,JSON.stringify(proposal));
writeFileSync('data/museum/spn-room-explorer-vraj-girnar-v1-design.json',JSON.stringify({options:[option],comparisonPrevious:design.comparisonPrevious,placements:[...option.primaryAssignments,...option.secondaryAssignments],heldCases}));
console.log('Verified all source allocations against the reviewed permutation and exact-record exceptions.');
