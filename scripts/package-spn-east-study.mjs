import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>JSON.parse(readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const handoffPath=process.argv[2];
if(!handoffPath)throw new Error('Provide the completed East study handoff');
const manifest=read(handoffPath.replace('-handoff.json','-manifest.json'));
for(const file of manifest.files){
 if(createHash('sha256').update(readFileSync(file.path)).digest('hex')!==file.sha256)throw new Error(`Manifest mismatch: ${file.path}`);
}
const handoff=read(handoffPath),layout=read(handoff.files.layout);
const output='data/museum/spn-room-proposal-east-v2.json';
execFileSync(process.execPath,['scripts/package-spn-explorer.mjs',handoffPath,handoff.freshDataBaseline.snapshotPath,output],{stdio:'inherit'});
const proposal=read(output),option=layout.options.find(o=>o.id===layout.activeOptionId);
const baseline=read('data/museum/spn-room-proposal-v16-r1.json');
const design=read('data/museum/spn-room-explorer-v16-r1-design.json');
const validation=read(handoffPath.replace('-handoff.json','-validation.json'));
const originalRows=new Map(baseline.rows.map(r=>[r.sourceId,r]));
const studyV1=read(handoff.files.sourceAllocations.replace('2026-10-26-v2','2026-10-25-v1'));
const priorStudy=new Map(studyV1.sourceObservationAssignments.map(r=>[r.sourceRecordId,r]));
const exceptions={recmarxKCZnFGzlo0:'2',recQTaLJGkfBoAU2w:'36'};
for(const row of proposal.rows){
 const original=originalRows.get(row.sourceId);
 if(!original||original.saintId!==row.saintId||original.share!==row.share||row.vitrine!==String(exceptions[row.sourceId]??validation.sourceCasePermutation[original.vitrine]??original.vitrine)||row.vitrine!==String(priorStudy.get(row.sourceId)?.vitrine))throw new Error(`Unexpected allocation: ${row.sourceId}`);
}
proposal.title=option.title;
proposal.reviewStatus='comparison-study';
proposal.reviewNote='Comparison study · Vitrine 2’s Vraj arrangement is still under review. Viewing this study does not apply a move plan.';
proposal.studyQualifications=handoff.studyQualifications;
const kinds=new Map(design.options[0].displayPackets.map(p=>[p.unitId,p.navigationKind]));
for(const packet of option.displayPackets){
 if(!kinds.has(packet.unitId))throw new Error(`Review navigation meaning: ${packet.unitId}`);
 packet.navigationKind=kinds.get(packet.unitId);
 if(packet.unitId==='kriya')packet.label='Core Kriya family together';
}
option.primeAnchors['77']={people:'Bhaktisiddhanta Sarasvati · A. C. Bhaktivedanta Swami Prabhupada',reason:'Gaudiya Math and modern Gaudiya missions. All proposed family members remain together; this focus does not rank their historical relationships.'};
option.tradeoffs.push(...handoff.studyQualifications);
const heldCases=[...handoff.heldCases,{case:'Baman Goswami identity',status:'Exact identity under review',saintIds:['cms0w7exp03jl07qicixobts0'],destination:77,reason:'The source name has not been confirmed as Bhaktivedanta Vamana Goswami. His existing Primary tier and proposed placement are retained.'}];
writeFileSync(output,JSON.stringify(proposal));
writeFileSync('data/museum/spn-room-explorer-east-v2-design.json',JSON.stringify({options:[option],comparisonPrevious:design.comparisonPrevious,placements:[...option.primaryAssignments,...option.secondaryAssignments],heldCases}));
console.log('Packaged comparison study; verified every allocation against the reviewed case permutation.');
