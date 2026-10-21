const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const esbuild=require(path.join(root,'node_modules/esbuild'));
const output=path.join(require('node:os').tmpdir(),'section-destination-service-'+require('node:crypto').randomUUID()+'.cjs');
const mocks={
 './db':'export const db=globalThis.testDb;',
 './generated/prisma/client':'export const Prisma={sql:(p,...v)=>({p,v}),JsonNull:null,PrismaClientKnownRequestError:class extends Error{}};',
 './museum-service':'export class MuseumConflict extends Error{}',
 './vrindavan-working-data':'export const readVrindavanWorkingData=async()=>globalThis.testWorking();',
 './vrindavan-museum-inventory':'export const readVrindavanMuseumInventory=async()=>globalThis.testInventory();'
};
(async()=>{
 await esbuild.build({stdin:{contents:'export * from "./lib/vrindavan-proposal-service";export * from "./lib/vrindavan-section-destination";export * from "./lib/museum-curator-review";export * from "./lib/museum-arrangement-domain";',resolveDir:root,loader:'ts'},outfile:output,bundle:true,platform:'node',format:'cjs',plugins:[{name:'test-adapter',setup(b){b.onResolve({filter:/^(\.\/|@\/lib\/)/},a=>{const key=a.path.replace('@\/lib\/','./');return Object.hasOwn(mocks,key)?{path:key,namespace:'qa'}:null});b.onLoad({filter:/.*/,namespace:'qa'},a=>({contents:mocks[a.path],loader:'js'}));}}]});
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/museum/vrindavan-curator-confirmation-cases.json'),'utf8'));
 const c=manifest.cases[0],target=c.options[0].proposedSection;
 let state,seq=0,fail=false,api;
 const old=c.currentStatePreconditions.currentSection;
 const base=[{id:'vrindavan:'+c.saintId,saintId:c.saintId,name:c.displayName,section:old,tier:'Tertiary',familyId:c.currentStatePreconditions.existingFamilyKey||'',groupLabel:''}];
 const reset=(vitrines=['18'])=>{state={base:structuredClone(base),overrides:[],arrangements:[],areas:[{museumId:'museum-vrindavan',section:target,vitrines,flexiblePlacements:[],version:1,updatedById:'actor',updatedAt:'2026-10-21'}],audits:[],roles:['curator']};fail=false;};reset();
 const jsonClone=()=>structuredClone(state);
 globalThis.testWorking=()=>{const placements=state.base.map(b=>{const override=state.overrides.find(o=>o.saintId===b.saintId);const row={...b,...(override?{section:override.section,tier:override.tier,familyId:override.groupKey,groupLabel:override.groupLabel}:{})};row.curatorProposalRevision=(override?String(override.version):'0').padStart(64,'a');row.arrangement=api.arrangementControl(row,state.arrangements.find(a=>a.placementId===row.id),row.curatorProposalRevision);return row;});return {placements,sections:[{name:target,slug:'gaudiya'},{name:old,slug:'old'}],groupOptions:[{key:'family',label:'Family'}],families:[{key:'family',label:'Family',revision:'f'.repeat(64)}],audit:{snapshotHash:c.sourceSnapshotHash}};};
 globalThis.testInventory=()=>({snapshotHash:c.sourceSnapshotHash,entries:[]});
 const source=()=>({id:'source151',sourceKey:`vrindavan-workbook:${c.sourceSnapshotHash}:Sheet1:${c.sourceRows[0]}`,status:'identity_linked',normalizedJson:{mappingVersion:'vrindavan-identity-v1',sourceName:'test',sourceRow:c.sourceRows[0],name:c.displayName,place:'test',relic:'test',quantity:'1',display:'9',position:'4.2',comments:'',warnings:[],saintIds:[c.saintId],note:null}});
 globalThis.testDb={$queryRaw:async()=>[],user:{findUnique:async()=>({active:true,roles:state.roles})},saint:{findMany:async()=>[{id:c.saintId,version:c.currentStatePreconditions.saintVersion,status:'published',displayName:c.displayName}]},museumCollectionImport:{findMany:async()=>[source()]},
 museumSectionSpacePlan:{findMany:async()=>structuredClone(state.areas),update:async q=>{const a=state.areas.find(a=>a.section===q.where.museumId_section.section);Object.assign(a,{...q.data,version:a.version+1});return structuredClone(a);}},
 museumCuratorProposal:{findUnique:async q=>state.overrides.find(o=>o.saintId===q.where.museumId_saintId.saintId)||null,findMany:async()=>structuredClone(state.overrides),upsert:async q=>{let o=state.overrides.find(o=>o.saintId===q.where.museumId_saintId.saintId);if(o)Object.assign(o,{...q.update,version:o.version+1});else{ o={...q.create,version:1};state.overrides.push(o);}return structuredClone(o);}},
 museumArrangement:{findUnique:async q=>structuredClone(state.arrangements.find(a=>a.placementId===q.where.museumId_placementId.placementId)||null),findMany:async()=>structuredClone(state.arrangements),upsert:async q=>{let a=state.arrangements.find(a=>a.placementId===q.where.museumId_placementId.placementId);if(a)Object.assign(a,{...q.update,version:a.version+1});else{a={...q.create,version:1};state.arrangements.push(a);}return structuredClone(a);}},
 auditEvent:{findMany:async q=>structuredClone(state.audits.filter(a=>a.entityType===q.where.entityType).reverse()),create:async q=>{if(fail&&q.data.action==='museum.arrangement.updated')throw Error('audit failed');const a={...q.data,id:String(++seq),createdAt:String(seq)};state.audits.push(a);return structuredClone(a);}},
 $transaction:async fn=>{const before=jsonClone();try{return await fn(globalThis.testDb);}catch(e){state=before;throw e;}}
 };
 api=require(output);
 const row=()=>globalThis.testWorking().placements[0];
 const preview=()=>api.readVrindavanSectionDestinationPreview({saintId:c.saintId,section:target,groupKey:''});
 const save=async p=>api.saveVrindavanProposal({saintId:c.saintId,revision:row().curatorProposalRevision,section:target,tier:'Tertiary',groupKey:'',destinationRevision:p.revision},'actor');
 // Actual individual entrypoint, helper and arrangement writer.
 let p=await preview();assert.equal(p.rows[0].mode,'exact');await save(p);assert.equal(state.arrangements[0].vitrine,'18');assert.equal(state.arrangements[0].status,'Planned');
 reset();p=await preview();state.areas[0].version++;state.areas[0].vitrines=['19'];await assert.rejects(save(p),/changed/);assert.equal(state.overrides.length,0);
 reset();p=await preview();fail=true;await assert.rejects(save(p),/audit failed/);assert.equal(state.overrides.length,0);assert.equal(state.arrangements.length,0);assert.equal(state.audits.length,0);
 reset(['18','19']);p=await preview();await save(p);const current=row();assert.equal(current.arrangement.status,'Proposed');assert.deepEqual(state.areas[0].flexiblePlacements,[{id:current.id,revision:current.arrangement.revision}]);
 reset([]);p=await preview();await save(p);assert.equal(state.arrangements[0].status,'Proposed');assert.equal(state.arrangements[0].vitrine,null);
 // Family entrypoint, fresh destination revision and all changed members.
 reset();state.base[0].familyId='family';state.base.push({...state.base[0],id:'p2',saintId:'other',name:'Other'});p=await api.readVrindavanSectionDestinationPreview({familyKey:'family',section:target});await api.moveVrindavanFamily({familyKey:'family',revision:'f'.repeat(64),section:target,destinationRevision:p.revision},'actor');assert.equal(state.overrides.length,2);assert.ok(state.arrangements.every(a=>a.vitrine==='18'&&a.status==='Planned'));
 // Preserve previous physical confirmation evidence, never mark new plan implemented.
 reset();const before=row();state.arrangements.push({museumId:'museum-vrindavan',placementId:before.id,proposalRevision:before.arrangement.proposalRevision,status:'Implemented',vitrine:'16',shelf:'3.2',confirmedAt:new Date('2026-10-20T12:00:00Z'),inventoryAcknowledged:true,version:1});state.audits.push({entityType:'MuseumArrangement',entityId:before.id,action:'museum.arrangement.updated',afterJson:{museumId:'museum-vrindavan',status:'Implemented',vitrine:'16',shelf:'3.2',confirmedAt:'2026-10-20T12:00:00.000Z'}});p=await preview();await save(p);assert.equal(state.arrangements[0].status,'Planned');assert.equal(state.arrangements[0].shelf,null);assert.equal(state.arrangements[0].confirmedAt,null);assert.equal(state.audits[0].afterJson.vitrine,'16');
 // Actual curator confirmation entrypoint: area-dependent preview/revision and save.
 reset();let queue=await api.readMuseumCuratorReview('museum-vrindavan');let item=queue.cases.find(x=>x.caseId===c.caseId);assert.equal(item.status,'pending');assert.ok(item.options[0].changes.some(v=>v.field==='Planned destination'));
 const confirm=()=>api.saveMuseumCuratorReview({caseId:c.caseId,revision:item.revision,decision:'confirm_supported',explicitChoiceId:c.options[0].optionId},'actor');state.areas[0].version++;await assert.rejects(confirm(),/changed/);item=(await api.readMuseumCuratorReview('museum-vrindavan')).cases.find(x=>x.caseId===c.caseId);state.roles=[];await assert.rejects(confirm(),/permission/);state.roles=['curator'];fail=true;await assert.rejects(confirm(),/audit failed/);assert.equal(state.overrides.length,0);fail=false;await confirm();assert.equal(state.arrangements[0].vitrine,'18');assert.equal(state.arrangements[0].status,'Planned');
 console.log('PASS actual service entrypoints: individual exact/flexible/unassigned; family; curator preview/save; stale area; DB permission; atomic audit rollback; physical history retained. Synthetic adapter, not PostgreSQL concurrency verification.');
})();