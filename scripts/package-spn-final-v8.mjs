import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>JSON.parse(readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const input=process.argv[2];if(!input)throw new Error('Provide the final v8 handoff path');
const handoff=read(input),manifest=read(handoff.files.manifest);
for(const f of manifest.files)if(createHash('sha256').update(readFileSync(f.path)).digest('hex')!==f.sha256)throw new Error(`Manifest mismatch: ${f.path}`);
if(handoff.proposalVersion!=='spn-sikh-north-connections-2026-10-27-v8')throw new Error('Expected final v8 packet');
const layout=read(handoff.files.layout),holdings=read(handoff.files.sourceAllocations),snapshot=read(handoff.freshDataBaseline.snapshotPath),validation=read(handoff.files.validation);
const baseline=read('data/museum/spn-room-proposal-sikh-north-v1.json'),prior=read('data/museum/spn-room-explorer-sikh-north-v1-design.json');
const option=layout.options.find(o=>o.id===layout.activeOptionId)??layout.options[0];
if(option.id!==handoff.proposalVersion)throw new Error('Layout and handoff differ');
const assigned=new Map(holdings.sourceObservationAssignments.map(r=>[r.sourceRecordId,r]));
if(assigned.size!==1423||assigned.size!==holdings.sourceObservationAssignments.length)throw new Error('Source coverage changed');
const live=new Map(snapshot.records.flatMap(r=>r.placements.map(p=>[p.placementId,p])));
function refresh(row){const p=row.baseline&&live.get(row.baseline.placementId);if(!p)return row;return {...row,tier:p.effectiveTier==='Featured'?'Primary':p.effectiveTier,baseline:{placementId:p.placementId,section:p.section,tier:p.effectiveTier,familyKey:p.familyKey||'',regionTags:p.spnRegionTags||[],revision:p.arrangement?.revision||'',proposalRevision:p.arrangement?.proposalRevision||''}}}
const rows=baseline.rows.map(row=>{const a=assigned.get(row.sourceId);if(!a||a.canonicalId!==row.saintId||a.observedShelfShare!==row.share||a.state!==row.state)throw new Error(`Raw evidence changed: ${row.sourceId}`);if(row.state==='fixed_stick_case'&&String(a.vitrine)!==row.vitrine)throw new Error('Fixed stick housing moved');return refresh({...row,vitrine:String(a.vitrine),allocationKind:a.allocationKind,planningShelfEstimate:a.planningShelfEstimate,spaceAssessmentState:a.spaceAssessmentState,spaceEstimateBasis:a.spaceEstimateBasis});});
const namedOnly=handoff.namedOnlyAssignments.map(refresh);
const sum=key=>rows.reduce((n,r)=>n+(r[key]??0),0);
if(Math.abs(sum('share')-303)>0.001||Math.abs(sum('planningShelfEstimate')-318.5)>0.001)throw new Error('Evidence/estimate totals changed');
if(rows.find(r=>r.sourceId==='rec6IqZR7ahPTDfEI')?.vitrine!=='70'||rows.find(r=>r.sourceId==='recMo8X6ehasAq0cW')?.vitrine!=='18')throw new Error('Approved full-height housing changed');
const audit=read(handoff.files.connectionAudit);const envelope=(rs,id)=>new Set(rs.filter(r=>r.saintId===id).map(r=>r.vitrine));
for(const relation of audit.relationships){const [a,b]=relation.endpoints;const beforeA=envelope([...baseline.rows,...baseline.namedOnly],a),beforeB=envelope([...baseline.rows,...baseline.namedOnly],b),afterA=envelope([...rows,...namedOnly],a),afterB=envelope([...rows,...namedOnly],b);if([...beforeA].some(v=>beforeB.has(v))&&![...afterA].some(v=>afterB.has(v)))throw new Error(`Reviewed pair split: ${a}/${b}`)}
const kinds=new Map(prior.options[0].displayPackets.map(p=>[p.unitId,p.navigationKind]));
option.displayPackets=option.displayPackets.map(p=>({...p,navigationKind:p.navigationKind??kinds.get(p.unitId)??'operational'}));
option.title='East–North connections';
option.largeObjects.fallback ??= 'Verify full-height housing and mounting before any physical move.';
const proposal={...baseline,version:handoff.proposalVersion,title:option.title,snapshotAt:snapshot.generatedAt,recordPreflightAt:snapshot.generatedAt,reviewedRelationshipPairs:audit.relationships.length,reviewStatus:'curator-review',reviewNote:'Latest proposal · source-context space estimates, with unknown sizes still to check. No physical moves are recorded.',layout:layout.layout,assignments:option.assignments,drivers:option.drivers,rows,namedOnly,indicators:handoff.vitrines.map(i=>{
 const items=rows.filter(r=>r.vitrine===i.vitrine),unresolved=items.filter(r=>r.unresolved),unknown=items.filter(r=>r.state==='unknown_shelf');
 const round=n=>Number(n.toFixed(4)),raw=items.reduce((n,r)=>n+(r.share??0),0);
 return {...i,totalObservedShelfShares:round(raw),comparisonHeadroomShelfShares:round(i.referenceShelfShares-raw),
 hasUnresolvedHoldings:unresolved.length>0,unresolvedLabel:unresolved.length?'Identity under review':null,unresolvedDisplayBand:unresolved.length?'lower':null,
 unresolvedSourceObservationCount:unresolved.length,unresolvedCanonicalCount:new Set(unresolved.map(r=>r.saintId).filter(Boolean)).size,
 unresolvedCanonicalIds:[...new Set(unresolved.map(r=>r.saintId).filter(Boolean))],unresolvedSourceRecordIds:unresolved.map(r=>r.sourceId),unresolvedNames:[...new Set(unresolved.map(r=>r.name))],unresolvedObservedShelfShares:round(unresolved.reduce((n,r)=>n+(r.share??0),0)),
 unknownShelfSourceObservationCount:unknown.length,unknownShelfSourceRecordIds:unknown.map(r=>r.sourceId),namedOnlyUnknownFootprintCount:namedOnly.filter(r=>r.vitrine===i.vitrine).length};
 }),visitorStoryRoute:handoff.visitorStoryRoute,tertiaryCityClusters:handoff.tertiaryCityClusters,cityReview:read(handoff.files.cityReview),spaceEstimateContract:handoff.spaceEstimateContract,validation,provenance:manifest.files.map(f=>({file:f.path.split(/[\\/]/).pop(),sha256:f.sha256})),amendments:[],flexibleSpaceExcludedVitrines:[...Object.keys(handoff.presentationRules.flexibleExclusions),'83','84','85']};
const write=(name,data)=>writeFileSync(`data/museum/${name}`,JSON.stringify(data));
write('spn-room-proposal-final-v8.json',proposal);
write('spn-room-explorer-final-v8-design.json',{options:[option],comparisonPrevious:prior.comparisonPrevious,placements:[...option.primaryAssignments,...option.secondaryAssignments],heldCases:handoff.heldCases});
write('spn-pilgrimage-final-v8.json',{html:readFileSync(handoff.files.preview,'utf8')});
write('spn-final-v8-validation.json',{...validation,packagingErratum:"Per-case raw totals, raw headroom, unresolved lists/counts and unknown-source lists recomputed from final destinations; source rows and planning estimates unchanged.",packagedProposalSha256:createHash('sha256').update(JSON.stringify(proposal)).digest('hex'),manifest:proposal.provenance,snapshotAt:snapshot.generatedAt,snapshotSha256:createHash('sha256').update(readFileSync(handoff.freshDataBaseline.snapshotPath)).digest('hex')});
console.log(`Packaged ${rows.length} observations, ${namedOnly.length} named holdings and ${proposal.indicators.length} cases; raw303 and planning318.5 preserved.`);
