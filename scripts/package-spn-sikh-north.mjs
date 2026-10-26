import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>JSON.parse(readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const path=process.argv[2];if(!path)throw new Error('Provide the approved Sikh–North review handoff');
const handoff=read(path),manifest=read(path.replace('-handoff.json','-manifest.json'));
for(const file of manifest.files)if(createHash('sha256').update(readFileSync(file.path)).digest('hex')!==file.sha256)throw new Error(`Manifest mismatch: ${file.path}`);
const preflightPath=process.argv[3];
if(!preflightPath)throw new Error('Provide the fresh read-only record preflight');
const preflight=read(preflightPath);
if(preflight.recordDrift.length||!['sourcesIdentical','decisionsIdentical','storedArrangementsIdentical','membershipsIdentical','familyMovesIdentical'].every(k=>preflight[k]))throw new Error('Newer records require reconciliation before packaging');
const layout=read(handoff.files.layout),holdings=read(handoff.files.sourceAllocations);
const baseline=read('data/museum/spn-room-proposal-vraj-girnar-v1.json'),priorDesign=read('data/museum/spn-room-explorer-vraj-girnar-v1-design.json');
const option=layout.options.find(o=>o.id===layout.activeOptionId)??layout.options[0];
const sources=new Map(holdings.sourceObservationAssignments.map(r=>[r.sourceRecordId,r]));
if(sources.size!==1423||holdings.sourceObservationAssignments.length!==1423)throw new Error('Incomplete or duplicated source inventory');
const rows=baseline.rows.map(row=>{const assigned=sources.get(row.sourceId);if(!assigned||assigned.canonicalId!==row.saintId||assigned.observedShelfShare!==row.share||assigned.state!==row.state)throw new Error(`Source evidence changed: ${row.sourceId}`);return {...row,vitrine:String(assigned.vitrine),allocationKind:assigned.allocationKind};});
for(const row of rows)if(row.state==='fixed_stick_case'&&row.vitrine!==baseline.rows.find(r=>r.sourceId===row.sourceId).vitrine)throw new Error('Walking-stick placement changed');
const namedOnly=baseline.namedOnly.map(row=>{const assigned=handoff.namedOnlyAssignments.find(r=>r.saintId===row.saintId);if(!assigned)throw new Error(`Missing named holding: ${row.saintId}`);return {...row,vitrine:assigned.vitrine};});
if(rows.find(r=>r.sourceId==='recMo8X6ehasAq0cW')?.vitrine!=='18'||rows.find(r=>r.sourceId==='rec6IqZR7ahPTDfEI')?.vitrine!=='64')throw new Error('Protected objects are not in their approved distinct destinations');
const exclusions={17:'Protected allowance for large Sikh relics; mounting and dimensions to verify.',18:'Approved full-height uniform destination; retain full-height housing.',23:'Full-height relocation dependency remains open.',30:'Fixed walking-stick housing.',31:'Fixed walking-stick housing.',64:'Protected full-height spade destination.',68:'Southern reuse depends on verified replacement housing for large Sikh relics.',69:'Southern use depends on execution of the approved uniform relocation; no physical vacancy confirmed.',70:'Protected Sikh expansion / mounting allowance; dimensions to verify.'};
const notes={17:'Confirm mounting and clearance for the large Sikh relics before relocating them. This reserved area is not certified capacity.',18:'Harbhajan Singh’s uniform is proposed here with the Sikh display. Equal height was confirmed by the curator; retain full-height housing. The physical move is not recorded as complete.',23:'Use Vitrine 23 only after its full-height objects have suitable housing: the spade in 64 and the uniform in 18. Proposed destinations are not completed moves.',64:'Hanuman Das Haridwar’s spade is a separate object from Harbhajan Singh’s uniform. Retain full-height housing and verify mounting and clearance.',68:'Place the southern families here only after replacement housing for the large Sikh relics is verified in the 17/70 allowance.',69:'Potential southern use depends on the uniform being relocated to 18. No physical vacancy is confirmed.',70:'Reserved as a possible Sikh mounting / expansion area. Check dimensions before using it; it is not confirmed free capacity.'};
const round=n=>Number(n.toFixed(4));
const indicators=baseline.indicators.map(old=>{
 const number=old.vitrine,assigned=option.assignments.find(a=>a.number===number),items=rows.filter(r=>r.vitrine===number),unresolved=items.filter(r=>r.unresolved),unknown=items.filter(r=>r.state==='unknown_shelf');
 const total=round(items.reduce((s,r)=>s+(r.share??0),0)),headroom=round(old.referenceShelfShares-total),exclusion=exclusions[number]??null;
 const potential=!exclusion&&headroom>=1&&!['83','84','85'].includes(number);
 return {...old,mainRegionCode:assigned?.group??old.mainRegionCode,mainRegionLabel:assigned?.region??old.mainRegionLabel,mainFocus:assigned?.subsection??old.mainFocus,
  hasUnresolvedHoldings:unresolved.length>0,unresolvedLabel:unresolved.length?'Identity under review':null,unresolvedDisplayBand:unresolved.length?'lower':null,
  unresolvedSourceObservationCount:unresolved.length,unresolvedCanonicalCount:new Set(unresolved.map(r=>r.saintId).filter(Boolean)).size,
  unresolvedCanonicalIds:[...new Set(unresolved.map(r=>r.saintId).filter(Boolean))],unresolvedSourceRecordIds:unresolved.map(r=>r.sourceId),unresolvedNames:[...new Set(unresolved.map(r=>r.name))],unresolvedObservedShelfShares:round(unresolved.reduce((s,r)=>s+(r.share??0),0)),
  totalObservedShelfShares:total,comparisonHeadroomShelfShares:headroom,potentialFlexibleSpace:potential,flexibleSpaceLabel:potential?'Potential flexible space':null,flexibleSpaceExclusion:exclusion,
  specialFitNote:notes[number]??(unknown.length?'Some source observations have unknown shelf footprints. Confirm their size before using the estimated remaining space.':null),unknownShelfSourceObservationCount:unknown.length,unknownShelfSourceRecordIds:unknown.map(r=>r.sourceId),namedOnlyUnknownFootprintCount:namedOnly.filter(r=>r.vitrine===number).length,fitConfirmed:false,operationalSpaceReserved:!!exclusion};
});
const kinds=new Map(priorDesign.options[0].displayPackets.map(p=>[p.unitId,p.navigationKind]));
option.displayPackets=option.displayPackets.filter(p=>!['buddhist','uniform_hold'].includes(p.unitId));
for(const packet of option.displayPackets){
 packet.navigationKind=packet.navigationKind??kinds.get(packet.unitId);
 if(!['neighborhood','operational'].includes(packet.navigationKind))throw new Error(`Review packet meaning: ${packet.unitId}`);
 if(packet.unitId==='uniform'){packet.cases=[18];packet.label='Harbhajan Singh uniform · approved full-height destination';packet.navigationKind='operational';}
 if(packet.unitId==='plow')packet.label='Hanuman Das Haridwar spade · full-height housing in 64';
 if(packet.unitId==='datta')packet.label='Prime Datta anchors at 3; other western / Datta groups in 81 and 82';
 if(packet.unitId==='ram_bhakti_boundary')packet.navigationKind='operational';
}
option.largeObjects={...option.largeObjects,uniform:'18',plow:'64',note:notes['18']+' '+notes['64'],fallback:notes['23']+' '+notes['68']};
option.sikhSizeAllowance={...option.sikhSizeAllowance,uniformSeparateFullHeightCase:'18',largeRelicReserve:'17',additionalMountingAllowance:'70',note:notes['17']+' '+notes['70']};
option.drivers.find(d=>d.connection==='Sikh / Udasi families beside the North').reason='The Sikh / Udasi families occupy 14–16 beside the North. The uniform has an approved proposed destination in 18; 17 and 70 retain mounting checks for other large objects. Regional proximity does not imply a teacher relationship.';
const south=option.drivers.find(d=>d.connection==='The South continues around the entrance room');south.places=[51,52,53,54,55,56,57,63,65,66,67,68,69];south.reason='Southern families remain together in 51–57 and move in intact groups to 63 and 65–68. Vitrine 64 holds the separate spade; 69 is potential southern expansion. Reuse of 68 depends on verified replacement housing for the large Sikh relics.';
option.tradeoffs=option.tradeoffs.filter(t=>!t.includes('protected 64/69'));option.tradeoffs.push(notes['68']);
option.title='Sikh–North connections';option.summary='Sikh and Udasi families join the North, with the uniform in 18. A distinct Buddhist display sits within the East; the West stays together and Samarth Ramdas meets the Ram Bhakti boundary. Mounting checks remain before implementation.';
option.assignments.find(a=>a.number==='64').subsection='Hanuman Das Haridwar spade · protected full-height housing';
indicators.find(i=>i.vitrine==='64').mainFocus=option.assignments.find(a=>a.number==='64').subsection;
const placements=[...option.primaryAssignments,...option.secondaryAssignments];
for(const p of placements)if(p.saintId===rows.find(r=>r.sourceId==='recMo8X6ehasAq0cW').saintId){p.vitrine=18;p.rationale=notes['18'];}
const heldCases=[...handoff.heldCases,...priorDesign.heldCases.filter(c=>!handoff.heldCases.some(h=>h.case===c.case))].map(c=>{const destinations=[...new Set(rows.filter(r=>c.saintIds.includes(r.saintId)).map(r=>r.vitrine))];return destinations.length===1?{...c,destination:Number(destinations[0])}:c;});
const provenance=[preflightPath,path,handoff.files.layout,handoff.files.sourceAllocations,handoff.files.connectionAudit].map(file=>({file:file.split(/[\\/]/).pop(),sha256:createHash('sha256').update(readFileSync(file)).digest('hex')}));
const audit=read(handoff.files.connectionAudit);
const envelope=(items,id)=>new Set(items.filter(r=>r.saintId===id).map(r=>r.vitrine));
let checkedPairs=0;
for(const relation of audit.relationships){const [a,b]=relation.endpoints,oldA=envelope([...baseline.rows,...baseline.namedOnly],a),oldB=envelope([...baseline.rows,...baseline.namedOnly],b),newA=envelope([...rows,...namedOnly],a),newB=envelope([...rows,...namedOnly],b);if([...oldA].some(n=>oldB.has(n))&&![...newA].some(n=>newB.has(n)))throw new Error(`Reviewed pair newly separated: ${a}, ${b}`);checkedPairs++;}
const proposal={...baseline,recordPreflightAt:preflight.generatedAt,reviewedRelationshipPairs:checkedPairs,version:handoff.proposalVersion,title:option.title,reviewStatus:'curator-review',reviewNote:'Proposal for curator review · Uniform relocation to 18 is approved as a plan. Mounting checks remain for large objects; viewing this proposal does not record physical moves.',layout:layout.layout,assignments:option.assignments,drivers:option.drivers,rows,namedOnly,indicators,provenance,amendments:[],flexibleSpaceExcludedVitrines:[...Object.keys(exclusions),'83','84','85']};
writeFileSync('data/museum/spn-room-proposal-sikh-north-v1.json',JSON.stringify(proposal));
writeFileSync('data/museum/spn-room-explorer-sikh-north-v1-design.json',JSON.stringify({options:[option],comparisonPrevious:priorDesign.comparisonPrevious,placements,heldCases}));
console.log(`Packaged ${rows.length} source observations and ${namedOnly.length} named holdings; rebuilt ${indicators.length} vitrine indicators.`);
