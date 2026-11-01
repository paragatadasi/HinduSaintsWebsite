import test from 'node:test';
import assert from 'node:assert/strict';
import {spnDisplayTones,spnDisplayMatches,spnDisplayLabel,spnDisplayMemberships} from './spn-display-regions';
import layout from '../data/museum/layouts/spn-layout-2026-10-23.json';

test('reviewed presentation covers physical cases without renumbering',()=>{
 assert.deepEqual(Object.keys(spnDisplayTones).sort(),layout.vitrines.map(v=>v.number).sort());
 for(const n of ['27']) assert.equal(spnDisplayTones[n],'R');
 for(const n of ['23','24','37','73']) assert.equal(spnDisplayTones[n],'E');
 for(const n of ['64','65','66','67','68']) assert.equal(spnDisplayTones[n],'K');
 for(const n of ['17','18']) assert.equal(spnDisplayTones[n],'C');
});
test('bridges match both filters with one midpoint color',()=>{
 for(const [n,a,b,tone] of [['2','B','E','BE'],['5','N','E','EN'],['74','N','E','EN'],['61','W','S','SW'],['62','S','W','SW']]){
  assert.equal(spnDisplayTones[n],tone);
  assert.ok(spnDisplayMatches(n,a)); assert.ok(spnDisplayMatches(n,b));
  assert.equal(spnDisplayMemberships[n].length,2);
 }
 assert.equal(spnDisplayTones['80'],'W');
 assert.ok(spnDisplayMatches('80','N')); assert.ok(spnDisplayMatches('80','W'));
});
test('gray groups remain separately named and filterable',()=>{
 assert.notEqual(spnDisplayLabel('17'),spnDisplayLabel('64'));
 assert.equal(spnDisplayMatches('17','K'),false);
 assert.equal(spnDisplayMatches('64','C'),false);
 assert.equal(spnDisplayMatches('73','E'),true);
 assert.equal(spnDisplayMatches('73',null),true);
});
