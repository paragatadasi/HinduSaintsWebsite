import test from "node:test";
import assert from "node:assert/strict";
import {companionReadRevision,companionResourceRevision} from "./museum-companion-read-revision";
test("shared read revision changes for committed data, process and date projections",()=>{
 const options={epoch:"code",day:"2026-11-01"};const before=companionReadRevision("1",options);
 assert.equal(companionReadRevision("1",options),before);
 assert.notEqual(companionReadRevision("2",options),before);
 assert.notEqual(companionReadRevision("1",{...options,epoch:"new-code"}),before);
 assert.notEqual(companionReadRevision("1",{...options,day:"2026-11-02"}),before);
});
test("resource and selected-case ETags remain distinct on the same data revision",()=>{
 const revision=companionReadRevision("1",{epoch:"code",day:"2026-11-01"});
 assert.notEqual(companionResourceRevision(revision,"catalog"),companionResourceRevision(revision,"shelves:2"));
 assert.notEqual(companionResourceRevision(revision,"shelves:2"),companionResourceRevision(revision,"shelves:76"));
});
