import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {shuffleActions,shuffleSections,shuffleProgress} from "./spn-shuffle-guide";
import {MuseumShuffleGuide} from "../components/admin/museum-shuffle-guide";
test("shuffle checklist has stable unique actions and excludes the conditional fallback",()=>{
 assert.equal(shuffleActions.length,34);
 assert.equal(new Set(shuffleActions.map(a=>a.id)).size,34);
 assert.equal(shuffleProgress(new Set(shuffleActions.map(a=>a.id))).total,33);
 const fallback=shuffleActions.find(a=>a.conditional)!;
 assert.match(fallback.text,/Pushpamata and Shiva Satya Balayogi/);
 assert.deepEqual(shuffleProgress(new Set([fallback.id])),{total:33,completed:0});
 assert.equal(shuffleSections.length,3);
 assert.equal(shuffleActions.at(-1)?.text,"Switch the positions of Vitrines 58 and 47.");
});
test("shuffle renders one checkbox per action, fit notes and conditional explanation",()=>{
 const html=renderToStaticMarkup(React.createElement(MuseumShuffleGuide,{canEdit:true}));
 assert.equal((html.match(/type="checkbox"/g)??[]).length,34);
 assert.match(html,/Check space for Rangacharya/);
 assert.match(html,/leave them in 51 and pause/);
 assert.match(html,/Conditional/);
 assert.match(html,/Confirming a move saves the relic locations/);
 assert.equal((html.match(/disabled=""/g)??[]).length,34,"Cannot write until shared state loads");
});
