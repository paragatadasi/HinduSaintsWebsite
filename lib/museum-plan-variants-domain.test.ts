import assert from "node:assert/strict";
import {test} from "node:test";
import {compareVariant,variantSchema,validateTargetedMoveCapacity} from "./museum-plan-variants-domain";
const row={id:"a",saintId:"saint-a",section:"Section",proposalRevision:"same",vitrine:"3",shelf:"Top",flexibleVitrines:[]};
const variant=()=>variantSchema.parse({id:"full",name:"Full",createdAt:"now",updatedAt:"now",rows:[row],areas:[]});
test("changed location is previewed without treating snapshot as physical confirmation",()=>{const result=compareVariant(variant(),[{...row,status:"Planned",vitrine:"4"}]);assert.equal(result.changed,1);assert.equal(result.changes[0].to,"3 · Top");});
test("implemented arrangements at matching destinations stay untouched",()=>{const result=compareVariant(variant(),[{...row,status:"Implemented"}]);assert.equal(result.changed,0);assert.equal(result.preservedImplemented,1);});
test("identity and proposal revisions fail closed",()=>{for(const patch of [{saintId:"different"},{section:"Other"},{proposalRevision:"changed"}])assert.throws(()=>compareVariant(variant(),[{...row,status:"Planned",...patch}]),/changed/);});
test("new and deleted saints require review",()=>{assert.throws(()=>compareVariant(variant(),[]),/changed/);assert.throws(()=>compareVariant(variant(),[{...row,status:"Planned"},{...row,id:"b",status:"Planned"}]),/New saints/);});
test("template vitrine cannot exceed room range",()=>assert.equal(variantSchema.safeParse({...variant(),rows:[{...row,vitrine:"99"}]}).success,false));

test("flexible-only changes appear in preview",()=>{const saved={...variant(),rows:[{...row,vitrine:null,shelf:"",flexibleVitrines:["3","4"]}]};assert.equal(compareVariant(saved,[{...row,status:"Proposed",vitrine:"",shelf:"",flexibleVitrines:["3"]}]).changed,1);});

test("different future destination replans without claiming another implementation",()=>{const result=compareVariant(variant(),[{...row,status:"Implemented",vitrine:"4"}]);assert.equal(result.replannedImplemented,1);assert.equal(result.changed,1);assert.equal(result.preservedImplemented,0);});
test("targeted non-task preserves a physical confirmation",()=>{const saved={...variant(),scope:"targeted" as const,rows:[{...row,vitrine:null,shelf:""}]};assert.equal(compareVariant(saved,[{...row,status:"Implemented"}]).preservedImplemented,1);});

const capacityRow=(id:string,vitrine:string,packagingText:string)=>({id,saintId:id,name:id,section:"Section",family:"",tier:"tertiary",photo:false,needsResearch:false,status:"Proposed" as const,vitrine:"",shelf:"",revision:"r",lastConfirmed:null,sources:[{id:"source-"+id,vitrine,shelf:"1",relics:"",quantity:"1",shared:false,packagingText}]});
test("box-housed relic exchanges do not add frame-housed relic entries",()=>assert.deepEqual(validateTargetedMoveCapacity([capacityRow("a","3","Box")],[{saintId:"a",vitrine:"4"}]),[]));
test("incoming frame-housed relic entry requires an outgoing one in each receiving vitrine",()=>{const rows=[capacityRow("a","3","Frame"),capacityRow("b","4","Small frame")];assert.throws(()=>validateTargetedMoveCapacity(rows,[{saintId:"a",vitrine:"4"}]),/Pair each/);assert.equal(validateTargetedMoveCapacity(rows,[{saintId:"a",vitrine:"4"},{saintId:"b",vitrine:"3"}]).length,2);});
test("unknown, split and partial shared evidence fail closed",()=>{assert.throws(()=>validateTargetedMoveCapacity([capacityRow("a","3","")],[{saintId:"a",vitrine:"4"}]),/relic-housing evidence/);const a=capacityRow("a","3","Box");a.sources.push({...a.sources[0],id:"other",vitrine:"5"});assert.throws(()=>validateTargetedMoveCapacity([a],[{saintId:"a",vitrine:"4"}]),/multiple source/);const shared=capacityRow("a","3","Box");shared.sources[0].shared=true;assert.throws(()=>validateTargetedMoveCapacity([shared],[{saintId:"a",vitrine:"4"}]),/Shared source/);});
