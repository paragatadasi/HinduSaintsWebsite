const path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),esbuild=require(path.join(root,'node_modules/esbuild'));
const output=path.join(require('node:os').tmpdir(),'bindu-record-'+require('node:crypto').randomUUID()+'.cjs');
const mocks={
 './db':'export const db=globalThis.binduDb;',
 './generated/prisma/client':'export const Prisma={sql:(p,...v)=>({p,v}),JsonNull:null,PrismaClientKnownRequestError:class extends Error{}};',
 './museum-service':'export class MuseumConflict extends Error{}',
 './vrindavan-identity-review':'export const readVrindavanIdentityReview=async()=>globalThis.binduReview();',
 './vrindavan-working-data':'export const readVrindavanWorkingData=async()=>globalThis.binduWorking();',
 './vrindavan-section-destination':'export const sectionDestinationContext=async()=>globalThis.binduDestinations();export const synchronizeSectionDestinations=async(...args)=>globalThis.binduSync(...args);'
};
(async()=>{
 await esbuild.build({stdin:{contents:'export * from "./lib/bindu-private-museum-record";export * from "./lib/bindu-private-museum-record-domain";',resolveDir:root,loader:'ts'},outfile:output,bundle:true,platform:'node',format:'cjs',plugins:[{name:'synthetic-adapter',setup(b){b.onResolve({filter:/^\.\//},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'qa'}:null);b.onLoad({filter:/.*/,namespace:'qa'},a=>({contents:mocks[a.path],loader:'js'}));}}]});
 let state,api,fail=false;
 const clone=v=>structuredClone(v);
 const reset=()=>{state={roles:['site_admin'],saints:[],areas:[],overrides:[],audits:[],sync:[],source:{id:'cmus5tiuc04d307p7ff5stscn',status:'pending',sourceKey:'vrindavan-workbook:89c0c02dcab10d81b439943be6667c981e1995448f098abcdcaf4f3c39c28c62:Sheet1:179',fingerprint:'raw-fingerprint',rawJson:{cells:['Mata Bindu (Guruji’s Mother)','Mauritius','Ashes',null,'Urn',11,4.1]},itemId:null},data:{sourceRow:179,name:'Mata Bindu (Guruji’s Mother)',place:'Mauritius',relic:'Ashes',quantity:'',display:'11',position:'4.1',saintIds:[],note:null},sourceVersion:'a'.repeat(64)};fail=false;};reset();
 globalThis.binduReview=()=>({rows:[{row:clone(state.source),data:clone(state.data),version:state.sourceVersion}],saints:clone(state.saints)});
 globalThis.binduDestinations=()=>({working:{sections:[{name:'Bhakti Marga & Mauritius Lineage'}]},areas:clone(state.areas),snapshotHash:'89c0c02dcab10d81b439943be6667c981e1995448f098abcdcaf4f3c39c28c62'});
 globalThis.binduWorking=()=>({placements:state.data.saintIds.map(id=>({id:'vrindavan:'+id,saintId:id,name:'Bindu Mata',section:'Needs section proposal',familyId:'',arrangement:{status:'Proposed',vitrine:'',shelf:''}}))});
 globalThis.binduSync=async(tx,rows,section,actorId,context)=>{if(fail==='sync')throw Error('sync failed');state.sync.push({rows,section,actorId,areas:context.areas});};
 globalThis.binduDb={user:{findUnique:async()=>({active:true,roles:state.roles})},$executeRaw:async()=>0,$queryRaw:async()=>[],
 saint:{findMany:async()=>clone(state.saints),create:async q=>{const saint={id:'new-bindu',...q.data,aliases:q.data.aliases.create};state.saints.push(saint);return clone(saint);}},
 museumCollectionImport:{update:async q=>{Object.assign(state.source,q.data);state.data=clone(q.data.normalizedJson);return clone(state.source);}},
 museumCuratorProposal:{create:async q=>{const p={...q.data,version:1};state.overrides.push(p);return clone(p);}},
 auditEvent:{create:async q=>{if(fail==='audit'&&q.data.entityType==='MuseumCuratorProposal')throw Error('audit failed');state.audits.push(q.data);return q.data;}},
 $transaction:async fn=>{const prior=clone(state);try{return await fn(globalThis.binduDb);}catch(error){state=prior;throw error;}}
 };
 api=require(output);
 const plan=()=>api.readBinduPrivateMuseumPlan(api.BINDU_SOURCE_ID);
 const input=p=>({sourceId:p.sourceId,sourceVersion:p.sourceVersion,revision:p.revision,confirm:true});
 let p=await plan();assert.equal(p.canCreate,true);assert.equal(p.proposal.destination.mode,'unassigned');assert.deepEqual(p.proposal.destination.vitrines,[]);
 assert.equal(await api.readBinduPrivateMuseumPlan('other'),null);
 state.roles=['curator'];await assert.rejects(api.createBinduPrivateMuseumRecord(input(p),'actor'),/permissions/);assert.equal(state.saints.length,0);state.roles=['site_admin'];
 state.sourceVersion='b'.repeat(64);await assert.rejects(api.createBinduPrivateMuseumRecord(input(p),'actor'),/changed/);
 reset();p=await plan();state.areas=[{section:api.BINDU_SECTION,vitrines:['13'],version:1}];await assert.rejects(api.createBinduPrivateMuseumRecord(input(p),'actor'),/changed/);assert.equal(state.saints.length,0);
 reset();state.saints.push({id:'archived-bindu',displayName:'Other Name',canonicalName:'Other Name',slug:'other-name',status:'archived',aliases:[{alias:'Bindu Mata'}]});p=await plan();assert.equal(p.canCreate,false);assert.equal(p.existingSaints[0].id,'archived-bindu');await assert.rejects(api.createBinduPrivateMuseumRecord(input(p),'actor'),/existing identities/);
 for(const failure of ['audit','sync']){reset();p=await plan();fail=failure;await assert.rejects(api.createBinduPrivateMuseumRecord(input(p),'actor'));assert.equal(state.saints.length,0);assert.equal(state.source.status,'pending');assert.deepEqual(state.data.saintIds,[]);assert.equal(state.overrides.length,0);assert.equal(state.audits.length,0);}
 reset();p=await plan();const raw=clone(state.source.rawJson),result=await api.createBinduPrivateMuseumRecord(input(p),'actor');assert.equal(result.saintId,'new-bindu');assert.equal(result.destination.mode,'unassigned');assert.equal(state.saints.length,1);assert.equal(state.saints[0].status,'draft');assert.equal(state.saints[0].teamVisibility,'private');assert.equal(state.saints[0].publicationStatus,'unpublished');assert.ok(!('places' in state.saints[0]));assert.ok(!('birthYear' in state.saints[0]));assert.ok(!('relationshipsFrom' in state.saints[0]));assert.equal(state.source.status,'identity_linked');assert.deepEqual(state.data.saintIds,['new-bindu']);assert.deepEqual(state.source.rawJson,raw);assert.equal(state.source.fingerprint,'raw-fingerprint');assert.equal(state.data.display,'11');assert.equal(state.data.position,'4.1');assert.equal(state.overrides[0].section,api.BINDU_SECTION);assert.equal(state.overrides[0].tier,'Secondary');assert.equal(state.audits.length,3);assert.equal(state.sync[0].section,api.BINDU_SECTION);await assert.rejects(api.createBinduPrivateMuseumRecord(input(p),'actor'),/changed/);assert.equal(state.saints.length,1);
 for(const vitrines of [['13'],['13','14']]){reset();state.areas=[{section:api.BINDU_SECTION,vitrines,version:1}];p=await plan();assert.equal(p.proposal.destination.mode,vitrines.length===1?'exact':'flexible');assert.deepEqual(p.proposal.destination.vitrines,vitrines);assert.ok(!p.proposal.destination.vitrines.includes('11'));}
 reset();state.areas=[{section:api.BINDU_SECTION,vitrines:['13'],needsReview:true,version:1}];p=await plan();assert.equal(p.canCreate,false);assert.match(p.blockedReason,/stale flexible/);
 console.log('PASS private creation/source link/proposal: strict auth, source/catalogue/area revisions, archived alias duplicate hold, replay protection, audit/destination rollback, original source preservation, private/unpublished fields and target-area-only preview. Synthetic adapter; not PostgreSQL concurrency verification.');
})();