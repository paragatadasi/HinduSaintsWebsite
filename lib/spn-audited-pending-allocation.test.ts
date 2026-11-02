import test from 'node:test';
import assert from 'node:assert/strict';
import packet from '../data/museum/spn-audited-pending-allocation-v1.json';
import {projectAuditedPendingAllocations} from './spn-audited-pending-allocation';
import {buildLatestSpnReview} from './spn-reviewed-proposal';
import type {MuseumSaintPlacement} from './museum-proposals';
const sources=packet.sources.map(row=>({...row,identityChanged:false}));
const baseline=buildLatestSpnReview([]).rows;
test('five reviewed omissions lose active fallback targets, preserving input and unrelated rows',()=>{
 const before=JSON.stringify(baseline);
 const pending=projectAuditedPendingAllocations(baseline,[],[],sources);
 assert.equal(pending.length,5);
 const view=buildLatestSpnReview([],[],sources as Parameters<typeof buildLatestSpnReview>[2]);
 for(const source of sources){assert.ok(view.proposal.pendingPlacements.some(p=>p.sourceId===source.sourceId));assert.ok(!view.rows.some(row=>row.sourceId===source.sourceId));}
 assert.equal(JSON.stringify(baseline),before);
 assert.ok(view.rows.some(row=>row.effectiveVitrine==='64'));
});
test('new source identity/evidence and explicit curator targets take precedence',()=>{
 const source=sources[0];const row=baseline.find(r=>r.sourceId===source.sourceId)!;
 assert.equal(projectAuditedPendingAllocations([row],[],[],[{...source,sourceRevision:'changed'}]).length,0);
 assert.equal(projectAuditedPendingAllocations([row],[],[],[{...source,identityChanged:true}]).length,0);
 assert.equal(projectAuditedPendingAllocations([row],[],[{sourceId:source.sourceId,vitrine:'62'}],sources).length,0);
 const live={sourceRecordId:source.sourceId,saintId:source.saintId,arrangement:{status:'Planned',vitrine:'62',revision:'new'}} as MuseumSaintPlacement;
 assert.equal(projectAuditedPendingAllocations([row],[live],[],sources).length,0);
});
