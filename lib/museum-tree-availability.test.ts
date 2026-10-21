import test from "node:test";
import assert from "node:assert/strict";
import {treeAvailability} from "./museum-tree-availability";
import {guideConnections} from "./vrindavan-guide-connections-domain";
const people=["a","b","c"].map(id=>({id,name:id,birthYear:null,samadhiYear:null}));
const claim={id:"edge",fromSaintId:"a",toSaintId:"b",relationshipType:"disciple",status:"published",evidenceStatus:"certain",confidence:"high"};
test("only saints participating in a supported active connection have a tree",()=>{
 const has=treeAvailability(people,[claim],[],new Map(),[]);
 assert.equal(has("a"),true);assert.equal(has("b"),true);assert.equal(has("c","family"),false);
 for(const edge of [{...claim,status:"archived"},{...claim,toSaintId:"missing"},{...claim,toSaintId:"a"},{...claim,relationshipType:"associated"}])assert.equal(treeAvailability(people,[edge],[],new Map(),[])("a"),false);
});
test("guide-only connections and historical context count, unavailable endpoints do not",()=>{
 const guide={...guideConnections[0],from:{kind:"saint" as const,saintId:"a",label:"A"},to:{kind:"context" as const,key:"teacher",label:"Teacher"}};
 assert.equal(treeAvailability(people,[],[guide],new Map(),[])("a"),true);
 assert.equal(treeAvailability(people,[],[{...guide,to:{kind:"saint",saintId:"missing",label:"Missing"}}],new Map(),[])("a"),false);
});
test("preserved family edges count only for connected members and respect canonical rejection",()=>{
 const families=new Map<string,Record<string,string>[]>([["family",[{RecordId:"reca",Name:"A",Masters:"recb"},{RecordId:"recb",Name:"B"},{RecordId:"recc",Name:"C"}]]]);
 const links=["a","b","c"].map(id=>({id,externalId:"appBase:Saints:rec"+id,entityId:id}));
 const has=treeAvailability(people,[],[],families,links);
 assert.equal(has("a","suggested:family"),true);assert.equal(has("b","family"),true);assert.equal(has("c","family"),false);assert.equal(has("a","other"),false);
 assert.equal(treeAvailability(people,[{...claim,status:"archived"}],[],families,links)("a","family"),false);
});


