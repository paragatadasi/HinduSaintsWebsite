import {test} from "node:test";
import assert from "node:assert/strict";
import {retainPlannedDestination} from "./museum-proposal-edit-domain";
test("tier and family edits preserve only a current planned destination in the same section",()=>{
 assert.equal(retainPlannedDestination("Planned","Gaudiya","Gaudiya"),true);
 assert.equal(retainPlannedDestination("Planned","Gaudiya","Braj"),false);
 for(const status of [undefined,"Proposed","Implemented"])assert.equal(retainPlannedDestination(status,"Gaudiya","Gaudiya"),false);
});
