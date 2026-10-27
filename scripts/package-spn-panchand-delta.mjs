import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';

const root='data/museum/';
const read=name=>JSON.parse(readFileSync(root+name,'utf8').replace(/^\uFEFF/,''));
const write=(name,data)=>writeFileSync(root+name,JSON.stringify(data));
const hash=data=>createHash('sha256').update(JSON.stringify(data)).digest('hex');
const original=read('spn-room-proposal-final-v8.json');
const auditPath=process.argv[2];
if(!auditPath)throw new Error('Provide the immutable v8 connection-audit JSON path.');
const auditBytes=readFileSync(auditPath);
const audit=JSON.parse(auditBytes.toString('utf8').replace(/^\uFEFF/,''));
assert.equal(createHash('sha256').update(auditBytes).digest('hex'),original.provenance.find(p=>p.file===path.basename(auditPath))?.sha256,'Relationship audit provenance changed');
assert.equal(audit.relationships.length,99);
const proposal=structuredClone(original),design=read('spn-room-explorer-final-v8-design.json');
const companion=read('spn-pilgrimage-final-v8.json');
const version='spn-sikh-north-connections-2026-10-27-v9';
assert.equal(original.version,'spn-sikh-north-connections-2026-10-27-v8');
const changes=[
 {saintId:'cms0w7c7l002l07qieffb7lzl',sourceId:'rec0GbpMjM14oN5G2',from:'46',to:'22',reason:'Curator-approved Haridwar grouping; Panchand Giri joins the northern Haridwar companions.'},
 {saintId:'cms0w7cna00ks07qigutwo907',sourceId:'rec3HT7rDR1erZTnh',from:'22',to:'19',reason:'Northern source-context fit adjustment. Himachal source context supports this provisional neighborhood; identity remains under research. No historical affiliation is asserted.'}
];
const destinations=new Map(changes.map(c=>[c.saintId,c.to]));
assert.equal(audit.relationships.filter(r=>r.endpoints.some(id=>destinations.has(id))).length,0,'A newly related target needs review');
for(const change of changes){
 const matches=proposal.rows.filter(r=>r.saintId===change.saintId);
 assert.equal(matches.length,1,'Changed source set requires review');
 const row=matches[0];assert.equal(row.sourceId,change.sourceId);assert.equal(row.vitrine,change.from);
 assert.equal(row.tier,'Tertiary');assert.equal(row.baseline.familyKey,'');
 row.vitrine=change.to;
}

// Move the existing city interpretation; do not invent a locality for the research-held record.
const clusters=proposal.tertiaryCityClusters;
for(const change of changes){
 for(const cluster of [...clusters])for(const group of cluster.groups){
  const members=group.members.filter(m=>m.saintId===change.saintId);
  if(!members.length)continue;
  group.members=group.members.filter(m=>m.saintId!==change.saintId);
  let destination=clusters.find(c=>String(c.vitrine)===change.to);
  if(!destination){destination={...structuredClone(cluster),vitrine:Number(change.to),groups:[]};clusters.push(destination);}
  let target=destination.groups.find(g=>g.city===group.city);
  if(!target){target={...structuredClone(group),members:[]};destination.groups.push(target);}
  target.members.push(...members);
 }
}
proposal.tertiaryCityClusters=clusters.map(c=>({...c,groups:c.groups.filter(g=>g.members.length)})).filter(c=>c.groups.length).sort((a,b)=>a.vitrine-b.vitrine);
for(const city of proposal.cityReview){
 for(const member of city.members)if(destinations.has(member.saintId))member.vitrine=Number(destinations.get(member.saintId));
 city.afterVitrines={};
 for(const member of city.members)city.afterVitrines[member.vitrine]=(city.afterVitrines[member.vitrine]??0)+1;
 city.remainingSplit=Object.keys(city.afterVitrines).length>1;
}
const affected=new Set(changes.flatMap(c=>[c.from,c.to]));
const round=n=>Number(n.toFixed(4));
const sum=(rows,key)=>rows.reduce((n,r)=>n+(r[key]??0),0);
const unique=xs=>[...new Set(xs)];
for(const indicator of proposal.indicators){
 indicator.tertiaryCityClusters=proposal.tertiaryCityClusters.filter(c=>String(c.vitrine)===indicator.vitrine);
 if(!affected.has(indicator.vitrine))continue;
 const rows=proposal.rows.filter(r=>r.vitrine===indicator.vitrine),unresolved=rows.filter(r=>r.unresolved);
 const unknown=rows.filter(r=>r.state==='unknown_shelf');
 const unknownPlanning=rows.filter(r=>r.planningShelfEstimate==null&&!['fixed_stick_case','full_height'].includes(r.state));
 indicator.totalObservedShelfShares=round(sum(rows,'share'));
 indicator.comparisonHeadroomShelfShares=round(indicator.referenceShelfShares-sum(rows,'share'));
 indicator.estimatedRequiredShelfShares=round(sum(rows,'planningShelfEstimate'));
 indicator.planningHeadroomShelfShares=round(indicator.referenceShelfShares-sum(rows,'planningShelfEstimate'));
 indicator.hasUnresolvedHoldings=unresolved.length>0;
 indicator.unresolvedLabel=unresolved.length?'Identity under review':null;
 indicator.unresolvedDisplayBand=unresolved.length?'lower':null;
 indicator.unresolvedSourceObservationCount=unresolved.length;
 indicator.unresolvedCanonicalIds=unique(unresolved.map(r=>r.saintId).filter(Boolean));
 indicator.unresolvedCanonicalCount=indicator.unresolvedCanonicalIds.length;
 indicator.unresolvedSourceRecordIds=unresolved.map(r=>r.sourceId);
 indicator.unresolvedNames=unique(unresolved.map(r=>r.name));
 indicator.unresolvedObservedShelfShares=round(sum(unresolved,'share'));
 indicator.unknownShelfSourceObservationCount=unknown.length;
 indicator.unknownShelfSourceRecordIds=unknown.map(r=>r.sourceId);
 indicator.unknownPlanningFootprintCount=unknownPlanning.length;
 indicator.unknownPlanningFootprintSourceIds=unknownPlanning.map(r=>r.sourceId);
 indicator.namedOnlyUnknownFootprintCount=proposal.namedOnly.filter(r=>r.vitrine===indicator.vitrine).length;
 indicator.potentialFlexibleSpace=!indicator.flexibleSpaceExclusion&&!indicator.operationalSpaceReserved&&indicator.planningHeadroomShelfShares>=1&&!unknownPlanning.length&&!indicator.namedOnlyUnknownFootprintCount;
 indicator.flexibleSpaceLabel=indicator.potentialFlexibleSpace?'Potential flexible space':null;
}
const amendment={id:'panchand-haridwar-2026-10-27',previousVersion:original.version,previousProposalSha256:hash(original),changes:changes.map(c=>({...c,planningShelfEstimate:proposal.rows.find(r=>r.sourceId===c.sourceId).planningShelfEstimate})),scope:'Proposal destinations only; source, identity, tiers, review flags and physical state preserved.'};
proposal.version=version;
proposal.provenance.push(...['spn-room-proposal-final-v8.json','spn-room-explorer-final-v8-design.json','spn-pilgrimage-final-v8.json'].map(file=>({file,sha256:createHash('sha256').update(readFileSync(root+file)).digest('hex')})));
proposal.amendments=[...proposal.amendments,amendment];
proposal.validation={...proposal.validation,version,cityCohortsStillSplit:proposal.cityReview.filter(c=>c.remainingSplit).length,quantifiedFitMaximum:Math.max(...proposal.indicators.map(i=>i.estimatedRequiredShelfShares??0)),deltaCanonicalMoves:changes.length,deltaSourceObservations:changes.length};
const option=design.options[0];option.id=version;
option.tertiaryCityClusters=structuredClone(proposal.tertiaryCityClusters);
option.revisionChanges.push(...changes.map(c=>({saintId:c.saintId,name:proposal.rows.find(r=>r.sourceId===c.sourceId).name,fromVitrine:Number(c.from),toVitrine:Number(c.to),planningShelfEstimate:proposal.rows.find(r=>r.sourceId===c.sourceId).planningShelfEstimate,basis:c.reason})));
option.routeCompanion='spn-museum-india-pilgrimage-2026-10-27-v9-standalone.html';
for(const ledger of option.caseSpaceLedger){
 if(!affected.has(String(ledger.vitrine)))continue;
 const rows=proposal.rows.filter(r=>r.vitrine===String(ledger.vitrine));
 ledger.rebalancedObservedShelfShares=round(sum(rows,'share'));
 ledger.sourceObservationCount=rows.length;
 ledger.lowerReviewShelfShares=round(sum(rows.filter(r=>r.unresolved),'share'));
 ledger.upperRegionalShelfShares=round(sum(rows.filter(r=>!r.unresolved),'share'));
 ledger.estimatedRequiredShelfShares=round(sum(rows,'planningShelfEstimate'));
 ledger.planningHeadroomShelfShares=round(5-sum(rows,'planningShelfEstimate'));
}

// The static companion has one sandboxed srcdoc. Replace its JSON data, never execute its script.
const decode=s=>s.replaceAll('&quot;','"').replaceAll('&#x27;',"'").replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
const encode=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const frame=/srcdoc="([^"]*)"/.exec(companion.html);assert.ok(frame);
let src=decode(frame[1]);const start=src.indexOf('const DATA=')+'const DATA='.length;assert.ok(start>10);
let depth=0,inString=false,escaped=false,end=start;
for(;end<src.length;end++){
 const c=src[end];
 if(inString){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')inString=false;continue;}
 if(c==='"')inString=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0){end++;break;}
}
const route=JSON.parse(src.slice(start,end));
route.version='spn-museum-india-pilgrimage-2026-10-27-v9';route.baseline=version;
for(const stop of route.stops)stop.cityCohorts=proposal.tertiaryCityClusters.filter(c=>stop.cases.includes(c.vitrine));
src=src.slice(0,start)+JSON.stringify(route).replaceAll('</','<\\/')+src.slice(end);
companion.html=companion.html.replace(frame[0],()=>`srcdoc="${encode(src)}"`);

assert.equal(proposal.rows.length,1423);assert.equal(new Set(proposal.rows.map(r=>r.sourceId)).size,1423);
assert.ok(Math.abs(sum(proposal.rows,'share')-303)<1e-8);
assert.ok(Math.abs(sum(proposal.rows,'planningShelfEstimate')-318.5)<1e-8);
for(const [index,row] of proposal.rows.entries())assert.deepEqual({...row,vitrine:original.rows[index].vitrine},original.rows[index]);
assert.deepEqual(proposal.namedOnly,original.namedOnly);
assert.ok(proposal.indicators.every(i=>i.estimatedRequiredShelfShares<=5));
assert.equal(proposal.rows.find(r=>r.sourceId==='rec3HT7rDR1erZTnh').section,'Needs Research');
assert.equal(proposal.cityReview.find(c=>c.city==='Haridwar').remainingSplit,false);
for(const relation of audit.relationships){
 const envelope=(packet,id)=>new Set([...packet.rows,...packet.namedOnly].filter(r=>r.saintId===id).map(r=>r.vitrine));
 const [a,b]=relation.endpoints,beforeA=envelope(original,a),beforeB=envelope(original,b),afterA=envelope(proposal,a),afterB=envelope(proposal,b);
 if([...beforeA].some(v=>beforeB.has(v)))assert.ok([...afterA].some(v=>afterB.has(v)),'Reviewed relationship split');
}
const validation={...proposal.validation,amendment,affectedCases:proposal.indicators.filter(i=>affected.has(i.vitrine)).map(i=>({vitrine:i.vitrine,raw:i.totalObservedShelfShares,planning:i.estimatedRequiredShelfShares,planningHeadroom:i.planningHeadroomShelfShares})),reviewedRelationshipPairsChecked:audit.relationships.length,relationshipAuditSha256:createHash('sha256').update(auditBytes).digest('hex'),unchangedSourceFields:true,unchangedTiersAndFlags:true,physicalWrites:false,packagedProposalSha256:hash(proposal),previousProposalSha256:hash(original)};
write('spn-room-proposal-final-v9.json',proposal);
write('spn-room-explorer-final-v9-design.json',design);
write('spn-pilgrimage-final-v9.json',companion);
write('spn-final-v9-validation.json',validation);
console.log(JSON.stringify(validation.affectedCases));
