import test from "node:test";
import assert from "node:assert/strict";
import {answerInput, answerStatus, allowedDecisions, questionEvidence, questionStatus, type QuestionHistory} from "./museum-questionnaire-domain";

const answer = {museumId:"museum-spn",caseId:"spn:curator:rec1",revision:"a".repeat(64),decision:"unknown"};
test("unknown needs no explanation; recognition needs identifying evidence; other museums and extra effects are refused", () => {
  assert.equal(answerInput.parse(answer).note, "");
  assert.equal(answerInput.safeParse({...answer, decision:"recognized"}).success, false);
  assert.equal(answerInput.safeParse({...answer, decision:"recognized", identification:"A name from the label"}).success, true);
  assert.equal(answerInput.safeParse({...answer, museumId:"museum-vrindavan"}).success, false);
  assert.equal(answerInput.safeParse({...answer, saintId:"guess"}).success, false);
});
test("saved answers stay out of immediate questions until explicit evidence revision or reopen", () => {
  const history: QuestionHistory[] = [{id:"1",at:"2026-10-24",evidenceVersion:"v1",decision:"unknown",note:"",identification:"",referral:""}];
  assert.equal(questionStatus(history,"v1"),"research");
  assert.equal(questionStatus(history,"v2"),"awaiting_curator");
  assert.equal(questionStatus([{...history[0],decision:"reopen"}],"v1"),"awaiting_curator");
  assert.equal(answerStatus("recognized"),"verification");
  assert.equal(answerStatus("onsite"),"onsite");
  assert.equal(answerStatus("referral"),"referral");
  assert.equal(allowedDecisions(false).includes("unused"),false);
  assert.equal(allowedDecisions(true).includes("unused"),true);
});
test("evidence ignores refresh metadata and proposal churn but preserves meaningful identity clues", () => {
  const fields = {Name:" Mauni Baba\r\nNavadwip ","Vitrine #":21,Shelf:" a ",Place:["B","A"],"Bio/Info":"Teacher X"};
  assert.deepEqual(questionEvidence(fields),questionEvidence({...fields,Name:"Mauni Baba\nNavadwip","Vitrine #":"21",Shelf:"A",Place:["A","B"],importedAt:"later",Proposal:"new"}));
  assert.notDeepEqual(questionEvidence(fields),questionEvidence({...fields,"Bio/Info":"Teacher Y"}));
  assert.notDeepEqual(questionEvidence(fields),questionEvidence({...fields,Name:"Mauni Baba of Vrindavan"}));
  assert.deepEqual(questionEvidence({}),questionEvidence({Name:null,Shelf:""}));
});

import seed from '../data/museum/spn-curator-questions.json';
test('planning checks exclude supported geographic defaults and preserve explicit conflict review', () => {
  assert.equal(seed.cases.filter(c => c.reviewGroup === 'inventory').length, 4);
  assert.equal(seed.cases.filter(c => c.reviewGroup === 'conflict').length, 2);
  assert.equal(seed.cases.filter(c => c.reviewGroup === 'optional').length, 3);
  for (const c of seed.cases.filter(c => c.reviewGroup === 'inventory')) {
    assert.equal(c.questionType, 'source_entry_clarification');
    assert.match(c.question, /Is there an item/);
  }
  for (const id of ['recqIwxHUPhbdDOGa', 'rechNsZrAAHvPvA8L', 'rec5kC0WPXiXYelqp']) assert.equal(seed.cases.find(c => c.sourceRecordId === id)?.reviewGroup, 'optional');
  assert.equal(new Set(seed.cases.map(c => c.caseId)).size, 9);
});
