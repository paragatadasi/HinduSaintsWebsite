import test from "node:test";
import assert from "node:assert/strict";
import {canConfirmMuseumPlacement,museumPhysicalWriteAllowed} from "./museum-placement-access";
import {hasCapability} from "./permissions";

test("museum assistants have museum workflow authority without site administration",()=>{
 const roles=["museum_assistant"] as const;
 for(const cap of ["access_museum","view_museum_catalog","manage_museum","confirm_museum_placements"] as const)assert.equal(hasCapability(roles,cap),true);
 for(const cap of ["manage_users","manage_site","publish_content","edit_content","run_imports","resolve_reconciliation"] as const)assert.equal(hasCapability(roles,cap),false);
 assert.equal(canConfirmMuseumPlacement(roles),true);
});

test("all museum managers pass the action authorization gate; domain validation remains separate",()=>{
 for(const role of ["museum_assistant","curator","site_admin"] as const){
  for(const body of [{action:"undo"},{action:"preparation.update"},{action:"clear.correct"},{clearedVitrines:["1"]},{curatorAddition:{sourceId:"s",version:1}},{alternativeDecision:{}},{caseContentsStaging:{}}])assert.equal(museumPhysicalWriteAllowed([role],body),true);
 }
 for(const role of ["contributor","editor","translator"] as const)assert.equal(museumPhysicalWriteAllowed([role],{action:"undo"}),false);
});
