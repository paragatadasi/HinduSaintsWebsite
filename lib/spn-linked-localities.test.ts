import test from 'node:test';
import assert from 'node:assert/strict';
import {localityPoints, localitiesForSaints, saintHasLocality, projectLocality, provisionalLocalityForSaint} from './spn-linked-localities';
import {explorerSaints} from './spn-room-explorer';
import {buildLatestSpnReview} from './spn-reviewed-proposal';
const review = buildLatestSpnReview([]);

test('map follows effective destinations rather than captured proposal vitrines', () => {
  const point = localityPoints[0];
  const original = review.rows.find(r => point.sourceIds.includes(r.sourceId))!;
  assert.ok(original);
  const saints = explorerSaints([{...original,effectiveVitrine:'85'}]);
  assert.ok(localitiesForSaints(saints,'85').some(p=>p.id===point.id));
  assert.equal(localitiesForSaints(saints,original.vitrine).length,0);
  assert.equal(saintHasLocality(saints[0],'85',point.id),true);
  assert.equal(saintHasLocality(saints[0],original.vitrine,point.id),false);
});

test('unmapped records do not inherit another record’s place through a shared name', () => {
  const row = review.rows[0];
  const saints = explorerSaints([{...row,sourceId:'unmapped-record',effectiveVitrine:'85'}]);
  assert.deepEqual(localitiesForSaints(saints,'85'),[]);
});

test('map points have finite coordinates and unique IDs', () => {
  assert.equal(new Set(localityPoints.map(p=>p.id)).size,localityPoints.length);
  for(const point of localityPoints) assert.ok(projectLocality(point.coordinates).every(Number.isFinite));
});


test('Kamaal keeps provisional text without a stale Nepal point or invented Pune coordinates', () => {
  const before = JSON.stringify(localityPoints);
  const result = buildLatestSpnReview([], [{sourceId:'recpyhIScDxJbDdE1', vitrine:'62', shelf:null}]);
  const row = result.rows.find(r=>r.sourceId==='recpyhIScDxJbDdE1')!;
  assert.ok(row);
  const saint = explorerSaints([row])[0];
  assert.equal(provisionalLocalityForSaint(saint), 'Possible Khed Shivapur / Pune · identity review');
  assert.deepEqual(localitiesForSaints([saint], '62'), []);
  for(const point of localityPoints) assert.equal(saintHasLocality(saint, '62', point.id), false);
  assert.equal(JSON.stringify(localityPoints), before);
  const other = explorerSaints([{...row, sourceId:'another-source'}])[0];
  assert.equal(provisionalLocalityForSaint(other), null);
});
