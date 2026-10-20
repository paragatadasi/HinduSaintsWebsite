import test from "node:test";
import assert from "node:assert/strict";
import {parseSourceShelfPosition} from "./museum-source-shelf-position";
test("preserves curator-confirmed row.position with top-to-bottom row order",()=>assert.deepEqual(parseSourceShelfPosition("2.3"),{rawText:"2.3",row:2,position:3,precision:"row_and_position",rowOrder:"top_to_bottom"}));
test("omitted position is valid row-only evidence, never a default slot",()=>{const result=parseSourceShelfPosition("3");assert.equal(result.row,3);assert.equal(result.position,null);assert.equal(result.precision,"row_only");});
test("blank and ambiguous labels remain distinguishable without guessed placement",()=>{assert.equal(parseSourceShelfPosition("").precision,"unrecorded");for(const raw of ["3 / 4","D7 R2","3.","0.1","1.0","9007199254740993.1"]){const result=parseSourceShelfPosition(raw);assert.equal(result.precision,"unparsed");assert.equal(result.row,null);assert.equal(result.position,null);assert.equal(result.rawText,raw);}});
test("keeps raw text and observed rows beyond an editable planning assumption",()=>{const raw=" 6.12 ",result=parseSourceShelfPosition(raw);assert.equal(result.rawText,raw);assert.equal(result.row,6);assert.equal(result.position,12);});
