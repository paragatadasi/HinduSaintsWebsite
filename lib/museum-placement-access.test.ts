import test from "node:test";
import assert from "node:assert/strict";
import {canConfirmMuseumPlacement,museumPhysicalWriteAllowed} from "./museum-placement-access";
import {hasCapability} from "./permissions";
const body={museumId:"museum-spn",guideContext:{guideVersion:"v",contentDigest:"d",assignmentDigest:"a"},records:[{sourceId:"source",to:{kind:"vitrine",code:"2"}}]};
test("assistants can confirm a single guided placement without gaining curator powers",()=>{
 assert.equal(canConfirmMuseumPlacement(["museum_assistant"]),true);
 assert.equal(museumPhysicalWriteAllowed(["museum_assistant"],body),true);
 for(const cap of ["manage_museum","manage_users","publish_content"] as const)assert.equal(hasCapability(["museum_assistant"],cap),false);
 assert.equal(museumPhysicalWriteAllowed(["contributor"],body),false);
});
test("assistant envelope rejects clearing, corrections, unguided, multi-record, shelf and alternate writes",()=>{
 for(const change of [{action:"undo"},{action:"preparation.update"},{action:"clear.correct"},{clearedVitrines:[]},{initialCaseClearAcknowledged:true},{componentStagingAcknowledgements:[]},{retainedCaseClearanceAcknowledgement:{}},{curatorAddition:{sourceId:"source",version:1}},{alternativeDecision:{}},{guideContext:undefined},{museumId:"vrindavan"},{records:[...body.records,...body.records]},{records:[{to:{kind:"table",code:"staging-area"}}]},{records:[{to:{kind:"vitrine",code:"2",shelf:"A"}}]}])assert.equal(museumPhysicalWriteAllowed(["museum_assistant"],{...body,...change}),false,JSON.stringify(change));
});
test("curator and admin authority is unchanged",()=>{
 for(const role of ["curator","site_admin"] as const){assert.equal(canConfirmMuseumPlacement([role]),true);assert.equal(museumPhysicalWriteAllowed([role],{action:"undo"}),true);}
});
