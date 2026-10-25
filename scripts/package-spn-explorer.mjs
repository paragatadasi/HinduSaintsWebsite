import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const [handoffPath,snapshotPath,outputPath]=process.argv.slice(2);
if(!outputPath)throw new Error('Usage: node scripts/package-spn-explorer.mjs handoff.json current-snapshot.json output.json');
const read=p=>JSON.parse(readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const handoff=read(handoffPath),layout=read(handoff.files.layout),holdings=read(handoff.files.sourceAllocations),snapshot=read(snapshotPath);
const option=layout.options.find(o=>o.id===layout.activeOptionId)??layout.options[0];
const records=new Map(snapshot.records.map(r=>[r.saintId,r]));
const sources=new Map(snapshot.sourceObservations.map(r=>[r.sourceRecordId,r]));
const unresolved=new Set(handoff.vitrines.flatMap(v=>v.unresolvedSourceRecordIds));
const rows=holdings.sourceObservationAssignments.map(r=>{
 const record=records.get(r.canonicalId),placements=record?.placements??[];
 const placement=placements.find(p=>p.sourceRecordId===r.sourceRecordId)??(placements.length===1?placements[0]:null);
 const source=sources.get(r.sourceRecordId)?.rawSourceFields??{};
 return {sourceId:r.sourceRecordId,saintId:r.canonicalId??null,name:record?.name||r.name||source.Name||r.sourceRecordId,
  vitrine:String(r.vitrine),tier:placement?.effectiveTier??'Unclassified',section:placement?.section??'',
  sourceVitrine:String(source['Vitrine #']??''),sourceShelf:String(source.Shelf??''),unresolved:unresolved.has(r.sourceRecordId),
  allocationKind:r.allocationKind,share:r.observedShelfShare,state:r.state,
  baseline:placement?{placementId:placement.placementId,section:placement.section,tier:placement.effectiveTier,
   familyKey:placement.familyKey??'',regionTags:placement.spnRegionTags??[],revision:placement.arrangement?.revision??'',
   proposalRevision:placement.arrangement?.proposalRevision??''}:null};
});
if(rows.length!==1423||new Set(rows.map(r=>r.sourceId)).size!==1423)throw new Error('Incomplete or repeated source observations');
const namedOnly=handoff.namedOnlyAssignments??[...option.primaryAssignments,...option.secondaryAssignments].filter(a=>!rows.some(r=>r.saintId===a.saintId)).map(a=>{
 const record=records.get(a.saintId),p=record?.placements.length===1?record.placements[0]:null;
 return {sourceId:'',saintId:a.saintId,name:record?.name||a.name,vitrine:String(a.vitrine),tier:p?.effectiveTier??a.tier??'Unclassified',section:p?.section??'',
  sourceVitrine:p?.sourceLocation?.vitrine??'',sourceShelf:p?.sourceLocation?.shelf??'',unresolved:false,allocationKind:'Named proposal without linked source observation',share:null,state:'unknown',
  baseline:p?{placementId:p.placementId,section:p.section,tier:p.effectiveTier,familyKey:p.familyKey??'',regionTags:p.spnRegionTags??[],revision:p.arrangement?.revision??'',proposalRevision:p.arrangement?.proposalRevision??''}:null};
});
const versionLabel=handoff.proposalVersion.match(/v\d+$/)?.[0];
if(!versionLabel)throw new Error('Proposal version is required');
const result={version:handoff.proposalVersion,title:`Regional proposal · ${versionLabel}`,snapshotAt:snapshot.generatedAt,
 provenance:[handoffPath,handoff.files.layout,handoff.files.sourceAllocations,snapshotPath].map(p=>({file:path.basename(p),sha256:createHash('sha256').update(readFileSync(p)).digest('hex')})),
 layout:layout.layout,assignments:option.assignments,drivers:option.drivers,indicators:handoff.vitrines,rows,namedOnly};
writeFileSync(outputPath,JSON.stringify(result));
console.log(`Packaged ${rows.length} source observations, ${handoff.vitrines.length} vitrine indicators.`);
