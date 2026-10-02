import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeVisitPlace, visitPlaceSchema, visitPlaceWarnings, visitPlaceDecisionSchema } from "./visit-place-domain";
const row={name:"Test saint",slug:"test-saint",visit_place_name:"Memorial",visit_place_kind:"temple",locality:"Town",state_or_region:"Region",country:"India",latitude:12,longitude:70,location_confidence:"high",research_notes:"Research",sources:"https://hindusaints.org/saints/test-saint",catalog_places:null};
test("imported confidence does not remove independent-evidence and coordinate checks",()=>{
 const data=normalizeVisitPlace(row);assert.equal(data.catalog_places,"");assert.equal(data.coordinatePrecision,"unverified");assert.equal(visitPlaceWarnings(data).length,2);
 assert.equal(visitPlaceSchema.safeParse({...data,latitude:91}).success,false);assert.equal(visitPlaceSchema.safeParse({...data,longitude:null}).success,false);
 assert.equal(visitPlaceSchema.safeParse({...data,latitude:null,longitude:null}).success,true);
});
test("destination approval and catalog follow-up have independent prerequisites",()=>{
 const input={id:"cm123456789012345678901234",version:1,action:"approve",catalogDecision:"keep",evidence:"Book, page 10",confirm:"on"};
 assert.equal(visitPlaceDecisionSchema.safeParse(input).success,true);
 assert.equal(visitPlaceDecisionSchema.safeParse({...input,confirm:undefined}).success,false);
 assert.equal(visitPlaceDecisionSchema.safeParse({...input,evidence:""}).success,false);
 assert.equal(visitPlaceDecisionSchema.safeParse({...input,catalogDecision:"review_needed"}).success,false);
 assert.equal(visitPlaceDecisionSchema.safeParse({...input,catalogDecision:"review_needed",catalogNote:"Remove the collection location after evidence review"}).success,true);
 assert.equal(visitPlaceDecisionSchema.safeParse({...input,action:"defer",note:""}).success,false);
});
