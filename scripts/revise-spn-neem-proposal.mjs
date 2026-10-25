import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {basename} from 'node:path';
const read=p=>JSON.parse(readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const deltaPath=process.argv[2];
if(!deltaPath)throw new Error('Provide the approved Neem proposal delta path');
const delta=read(deltaPath),originalPath='data/museum/spn-room-proposal-v16.json';
const original=read(originalPath),proposal=structuredClone(original);
if(delta.baselineVersion!==original.version)throw new Error('Wrong proposal baseline');
const {saintId,sourceRecordId,from,to}=delta.change;
if(saintId!=='cms0w7jjj08x907qiyw8q9hae'||sourceRecordId!=='recxjM8XNprzBWzuT'||from!==26||to!==75)throw new Error('Not the approved single-source revision');
const holdings=read(delta.files.allocations),layout=read(delta.files.layout);
const assignments=new Map(holdings.sourceObservationAssignments.map(r=>[r.sourceRecordId,r]));
if(assignments.size!==original.rows.length)throw new Error('Source coverage changed');
for(const row of proposal.rows){
 const revised=assignments.get(row.sourceId);
 if(!revised||revised.canonicalId!==row.saintId||revised.observedShelfShare!==row.share)throw new Error('Source identity or footprint changed');
 const expected=row.sourceId===sourceRecordId?String(to):row.vitrine;
 if(String(revised.vitrine)!==expected)throw new Error('Unexpected allocation change');
 if(row.sourceId===sourceRecordId){if(row.vitrine!==String(from))throw new Error('Destination baseline changed');row.vitrine=expected;}
}
const option=structuredClone(layout.options.find(o=>o.id===layout.activeOptionId));
for(const p of option.displayPackets)p.navigationKind=['unresolved','uniform','plow','sticks','sikh_large'].includes(p.unitId)||['R','L','T'].includes(p.group)?'operational':'neighborhood';
const kriya=option.drivers.find(d=>d.connection==='Core Kriya guru tree');
kriya.places=[5];kriya.reason='Keep Babaji, Lahiri, Yukteswar, Yogananda and their reviewed companions together in Vitrine 5.';
delete kriya.contextPlaces;
const thematic=option.drivers.find(d=>d.connection==='North–Vraj lives');
if(!thematic)throw new Error('Missing reviewed thematic adjacency');
thematic.connectionKind='thematic';
const neem=option.primaryAssignments.find(p=>p.saintId===saintId);
neem.rationale=thematic.reason;
option.primeAnchors['75']={people:neem.name,reason:thematic.reason};
const design=read('data/museum/spn-room-explorer-v16-design.json');
proposal.version=original.version+'-r1';proposal.title='Regional proposal · v16 revision 1';
proposal.revision={packetVersion:delta.revisedVersion,parentVersion:original.version,sourceRecordId,from:String(from),to:String(to)};
proposal.provenance.push(...[originalPath,deltaPath,...Object.values(delta.files)].map(p=>({file:basename(p),sha256:createHash('sha256').update(readFileSync(p)).digest('hex')})));
proposal.assignments=option.assignments;proposal.drivers=option.drivers;
for(const n of [String(from),String(to)]){
 const i=proposal.indicators.find(i=>i.vitrine===n),load=proposal.rows.filter(r=>r.vitrine===n).reduce((s,r)=>s+(r.share??0),0);
 i.mainFocus=option.assignments.find(a=>a.number===n).subsection;
 i.totalObservedShelfShares=Number(load.toFixed(4));
 i.comparisonHeadroomShelfShares=Number((i.referenceShelfShares-load).toFixed(4));
 i.potentialFlexibleSpace=!i.flexibleSpaceExclusion&&i.comparisonHeadroomShelfShares>=1;
 i.flexibleSpaceLabel=i.potentialFlexibleSpace?'Potential flexible space':null;
}
writeFileSync('data/museum/spn-room-proposal-v16-r1.json',JSON.stringify(proposal));
writeFileSync('data/museum/spn-room-explorer-v16-r1-design.json',JSON.stringify({options:[option],comparisonPrevious:design.comparisonPrevious,placements:[...option.primaryAssignments,...option.secondaryAssignments],heldCases:design.heldCases}));
console.log('Revised only the approved source destination; original v16 preserved.');
