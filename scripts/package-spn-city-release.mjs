import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root='data/museum/';
const read=name=>JSON.parse(readFileSync(root+name,'utf8').replace(/^\uFEFF/,''));
const write=(name,value)=>writeFileSync(root+name,JSON.stringify(value));
const sha=value=>createHash('sha256').update(value).digest('hex');
const [candidatePath,auditPath]=process.argv.slice(2);
assert.ok(candidatePath&&auditPath,'Provide reviewed candidate and immutable relationship audit paths');
const candidateBytes=readFileSync(candidatePath),candidate=JSON.parse(candidateBytes.toString('utf8'));
assert.equal(sha(candidateBytes),'629e0355ce29fc7362fbc0c9c42ca6cc91ec77a411cb36de97c86b5e7e9ff95c','Use independently reviewed corrected v3');
const original=read('spn-room-proposal-final-v9.json'),proposal=structuredClone(original),design=read('spn-room-explorer-final-v9-design.json'),companion=read('spn-pilgrimage-final-v9.json');
assert.equal(sha(readFileSync(root+'spn-room-proposal-final-v9.json')),candidate.baselineSha256);
const auditBytes=readFileSync(auditPath),audit=JSON.parse(auditBytes.toString('utf8').replace(/^\uFEFF/,''));
assert.equal(sha(auditBytes),original.provenance.find(p=>p.file===path.basename(auditPath))?.sha256);
assert.equal(audit.relationships.length,99);
const version='spn-city-first-2026-10-27-v10';
proposal.rows=candidate.candidateRows;proposal.version=version;proposal.title='SPN museum proposal · city groups and protected families';
proposal.operationalClarifications={asOfDate:'2026-10-27',confirmedEmptyVitrines:['76','78'],basis:'Direct user clarification:76 and78 are empty new vitrines.',precedence:'Initial state only; newer curator-confirmed occupancy takes precedence. Empty state does not certify fit.'};
for(const v of proposal.layout.vitrines)if(['76','78'].includes(v.number))v.provisional=false;
assert.equal(proposal.rows.length,1423);assert.equal(new Set(proposal.rows.map(r=>r.sourceId)).size,1423);
for(const [i,row] of proposal.rows.entries())assert.deepEqual({...row,vitrine:original.rows[i].vitrine},original.rows[i]);
assert.deepEqual(proposal.namedOnly,original.namedOnly);
const sum=(rows,key)=>rows.reduce((n,r)=>n+(r[key]??0),0),round=n=>Number(n.toFixed(4)),unique=xs=>[...new Set(xs)];
assert.ok(Math.abs(sum(proposal.rows,'share')-303)<1e-8);assert.ok(Math.abs(sum(proposal.rows,'planningShelfEstimate')-318.5)<1e-8);
const bySaint=new Map();for(const row of proposal.rows)if(row.saintId)bySaint.set(row.saintId,[...(bySaint.get(row.saintId)??[]),row]);
const changes=proposal.rows.flatMap((r,i)=>r.vitrine===original.rows[i].vitrine?[]:[{sourceId:r.sourceId,saintId:r.saintId,name:r.name,from:original.rows[i].vitrine,to:r.vitrine,planningShelfEstimate:r.planningShelfEstimate}]);
assert.equal(changes.length,412);assert.ok(changes.every(c=>proposal.rows.find(r=>r.sourceId===c.sourceId).tier==='Tertiary'));
// Transfer existing city evidence by source identity; qualifiers remain proposal evidence only.
const cityMembers=[];
for(const cluster of original.tertiaryCityClusters)for(const group of cluster.groups)for(const member of group.members){
 for(const vitrine of unique((bySaint.get(member.saintId)??[]).map(r=>r.vitrine)))cityMembers.push({city:group.city,member:structuredClone(member),vitrine});
}
const qualified=[['cms0w7e4p02hi07qi70to30jd','Prayagraj','Reviewed Teliarganj source context'],['cms0w7eos037n07qighaoe0dn','Prayagraj','Reviewed Allahabad source context'],['cms0w7er603az07qi1zah564g','Patna','Kadamkunha, Patna source; Ramanandi label retained'],['cms0w7ftv04ok07qije4e0vfo','Vrindavan','User-confirmed locality; identity spelling retained'],['cms0w7jsv097007qi5ec4iz5f','Deeg / Braj Kedarnath','Exact source locality; Vraj/Ramanandi regional companion']];
for(const [id,city,evidence]of qualified)for(const row of bySaint.get(id)??[])if(!cityMembers.some(m=>m.city===city&&m.member.saintId===id&&m.vitrine===row.vitrine))cityMembers.push({city,member:{saintId:id,name:row.name,evidence,familyProtected:false},vitrine:row.vitrine});
const clusters=[];
for(const item of cityMembers){
 let cluster=clusters.find(c=>String(c.vitrine)===item.vitrine);if(!cluster){cluster={vitrine:Number(item.vitrine),groups:[],placement:'Protected personal groups first; distinct source-qualified city cohorts remain labelled separately.'};clusters.push(cluster);}
 let group=cluster.groups.find(g=>g.city===item.city);if(!group){group={city:item.city,members:[]};cluster.groups.push(group);}
 if(!group.members.some(m=>m.saintId===item.member.saintId))group.members.push(item.member);
}
proposal.tertiaryCityClusters=clusters.sort((a,b)=>a.vitrine-b.vitrine);
for(const city of proposal.cityReview){
 for(const member of city.members){const destinations=unique((bySaint.get(member.saintId)??[]).map(r=>r.vitrine));assert.equal(destinations.length,1);member.vitrine=Number(destinations[0]);}
 city.afterVitrines={};for(const member of city.members)city.afterVitrines[member.vitrine]=(city.afterVitrines[member.vitrine]??0)+1;
 city.remainingSplit=Object.keys(city.afterVitrines).length>1;
}
for(const indicator of proposal.indicators){
 const rows=proposal.rows.filter(r=>r.vitrine===indicator.vitrine),unresolved=rows.filter(r=>r.unresolved),unknown=rows.filter(r=>r.state==='unknown_shelf'),unknownPlanning=rows.filter(r=>r.planningShelfEstimate==null&&!['fixed_stick_case','full_height'].includes(r.state));
 Object.assign(indicator,{tertiaryCityClusters:proposal.tertiaryCityClusters.filter(c=>String(c.vitrine)===indicator.vitrine),totalObservedShelfShares:round(sum(rows,'share')),comparisonHeadroomShelfShares:round(indicator.referenceShelfShares-sum(rows,'share')),estimatedRequiredShelfShares:round(sum(rows,'planningShelfEstimate')),planningHeadroomShelfShares:round(indicator.referenceShelfShares-sum(rows,'planningShelfEstimate')),hasUnresolvedHoldings:unresolved.length>0,unresolvedLabel:unresolved.length?'Identity under review':null,unresolvedDisplayBand:unresolved.length?'lower':null,unresolvedSourceObservationCount:unresolved.length,unresolvedCanonicalIds:unique(unresolved.map(r=>r.saintId).filter(Boolean)),unresolvedCanonicalCount:unique(unresolved.map(r=>r.saintId).filter(Boolean)).length,unresolvedSourceRecordIds:unresolved.map(r=>r.sourceId),unresolvedNames:unique(unresolved.map(r=>r.name)),unresolvedObservedShelfShares:round(sum(unresolved,'share')),unknownShelfSourceObservationCount:unknown.length,unknownShelfSourceRecordIds:unknown.map(r=>r.sourceId),unknownPlanningFootprintCount:unknownPlanning.length,unknownPlanningFootprintSourceIds:unknownPlanning.map(r=>r.sourceId),namedOnlyUnknownFootprintCount:proposal.namedOnly.filter(r=>r.vitrine===indicator.vitrine).length});
 indicator.potentialFlexibleSpace=!indicator.flexibleSpaceExclusion&&!indicator.operationalSpaceReserved&&indicator.planningHeadroomShelfShares>=1&&!unknownPlanning.length&&!indicator.namedOnlyUnknownFootprintCount;
 indicator.flexibleSpaceLabel=indicator.potentialFlexibleSpace?'Potential flexible space':null;
}
assert.ok(proposal.indicators.every(i=>i.estimatedRequiredShelfShares<=5));
const rowCases=['2','78','36','29','76','28','27'];
const warning='Known shelf-share subtotals are comparisons, not measured physical capacity. Hemalata in2, Sudama Das and Sant Ramdas in78, and Maha Maitrayani in28 retain unknown footprints. They do not block displaying the approved proposal; inspect fit before physical handling. No physical move has been confirmed.';
const amendment={id:'city-first-reviewed-v3-2026-10-27',previousVersion:original.version,reviewedCandidateSha256:sha(candidateBytes),changes,scope:'Approved display proposal only; identities, traditions, tiers, source values, review flags and physical history unchanged.',fitWarning:warning};
proposal.provenance.push({file:'spn-city-review-corrected-v3.json',sha256:sha(candidateBytes)},{file:'spn-room-proposal-final-v9.json',sha256:sha(readFileSync(root+'spn-room-proposal-final-v9.json'))});
proposal.amendments.push(amendment);proposal.reviewStatus='Curator-approved city-first proposal; physical fit and moves remain unconfirmed';proposal.reviewNote=warning;
proposal.validation={...proposal.validation,version,cityCohortsStillSplit:proposal.cityReview.filter(c=>c.remainingSplit).length,quantifiedFitMaximum:Math.max(...proposal.indicators.map(i=>i.estimatedRequiredShelfShares??0)),deltaSourceObservations:changes.length,deltaCanonicalMoves:unique(changes.map(c=>c.saintId)).length};
proposal.drivers=proposal.drivers.filter(d=>!['Girnar and Nath continuity'].includes(d.connection));
proposal.drivers.push({connection:'Source-qualified city centers',places:[39,40,58,59,60,27,28,76,29],reason:'Pushkar39/40 and Girnar58–60 stay coherent; Prayagraj27 is distinct. Case29 includes a labelled Chitrakoot/Rama continuation beside Tulsidas36 while keeping Kabir and Kashi personal groups intact. No new historical relationships are asserted.'});
for(const a of proposal.assignments){
 if(a.number==='29')a.subsection='Kabir and Kashi traditions · separate Chitrakoot/Rama continuation';
 if(a.number==='27')a.subsection='Prayagraj · separate Naimisharanya source cohort';
 if(a.number==='64'){a.subsection='Southern source holding: Sri Potty Amma · verify availability';a.allocationType='source_qualified_regional_holding';}
 if(a.number==='69')a.subsection='Bengaluru / Karnataka city cohort · availability and footprint check';
}
const option=design.options[0];option.id=version;option.title=proposal.title;option.summary=warning;option.reviewStatus=proposal.reviewStatus;option.assignments=structuredClone(proposal.assignments);option.tertiaryCityClusters=structuredClone(proposal.tertiaryCityClusters);option.drivers=structuredClone(proposal.drivers);option.revisionChanges.push(...changes.map(c=>({saintId:c.saintId,name:c.name,fromVitrine:Number(c.from),toVitrine:Number(c.to),planningShelfEstimate:c.planningShelfEstimate,basis:'Approved city-first allocation; exact source context and protected family constraints retained.'})));option.routeCompanion='spn-museum-india-pilgrimage-2026-10-27-v10-standalone.html';
for(const placement of design.placements){const cases=unique((bySaint.get(placement.saintId)??[]).map(r=>Number(r.vitrine)));if(cases.length===1){placement.vitrine=cases[0];placement.caseOptions=cases;}}
for(const ledger of option.caseSpaceLedger){const rows=proposal.rows.filter(r=>r.vitrine===String(ledger.vitrine));Object.assign(ledger,{rebalancedObservedShelfShares:round(sum(rows,'share')),sourceObservationCount:rows.length,lowerReviewShelfShares:round(sum(rows.filter(r=>r.unresolved),'share')),upperRegionalShelfShares:round(sum(rows.filter(r=>!r.unresolved),'share')),estimatedRequiredShelfShares:round(sum(rows,'planningShelfEstimate')),planningHeadroomShelfShares:round(5-sum(rows,'planningShelfEstimate'))});}
// Update the sandboxed static companion's data, without executing its script.
const decode=s=>s.replaceAll('&quot;','"').replaceAll('&#x27;',"'").replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');const encode=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const frame=/srcdoc="([^"]*)"/.exec(companion.html);assert.ok(frame);let src=decode(frame[1]),start=src.indexOf('const DATA=')+11,depth=0,inString=false,escaped=false,end=start;
for(;end<src.length;end++){const c=src[end];if(inString){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')inString=false;continue;}if(c==='"')inString=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0){end++;break;}}
const route=JSON.parse(src.slice(start,end));route.version='spn-museum-india-pilgrimage-2026-10-27-v10';route.baseline=version;for(const stop of route.stops)stop.cityCohorts=proposal.tertiaryCityClusters.filter(c=>stop.cases.includes(c.vitrine));src=src.slice(0,start)+JSON.stringify(route).replaceAll('</','<\\/')+src.slice(end);companion.html=companion.html.replace(frame[0],()=>`srcdoc="${encode(src)}"`);
for(const relation of audit.relationships){const envelope=(packet,id)=>new Set([...packet.rows,...packet.namedOnly].filter(r=>r.saintId===id).map(r=>r.vitrine));const[a,b]=relation.endpoints,beforeA=envelope(original,a),beforeB=envelope(original,b),afterA=envelope(proposal,a),afterB=envelope(proposal,b);if([...beforeA].some(v=>beforeB.has(v)))assert.ok([...afterA].some(v=>afterB.has(v)));}
const validation={...proposal.validation,reviewedCandidateSha256:sha(candidateBytes),reviewedRelationshipPairsChecked:99,relationshipAuditSha256:sha(auditBytes),unchangedSourceFields:true,unchangedTiersAndFlags:true,physicalWrites:false,fitWarning:warning,priorityRow:rowCases.map(v=>proposal.indicators.find(i=>i.vitrine===v)),packagedProposalSha256:sha(JSON.stringify(proposal))};
write('spn-room-proposal-final-v10.json',proposal);write('spn-room-explorer-final-v10-design.json',design);write('spn-pilgrimage-final-v10.json',companion);write('spn-final-v10-validation.json',validation);console.log(JSON.stringify({version,changes:changes.length,knownMaximum:validation.quantifiedFitMaximum,priorityCases:rowCases,sourceHash:sha(candidateBytes)}));
