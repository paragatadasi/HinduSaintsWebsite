import test from "node:test";
import assert from "node:assert/strict";
import {vrindavanSectionView} from "./vrindavan-section-view";
type Input=Parameters<typeof vrindavanSectionView>[0];
const saint=(id:string,proposals:unknown[])=>({saintId:id,name:"Fixture",sourceRows:[1],proposals,needsSectionReview:proposals.length!==1,placeComparisons:[],spiritualRegions:[],primaryPlaces:[]}) as unknown as Input["rows"][number];
const proposal={section:"Geographic",tier:"Featured",confidence:"High",alternatives:[],rationale:"Original",spnState:"Confirmed",state:"Proposed",evidence:"inherited_spn"};
const sections=[{name:"Geographic",slug:"geographic"},{name:"Gaudiya Vaishnava",slug:"gaudiya-vaishnava"}];
test("Vrindavan preserves candidates as Proposed without copying SPN operational state",()=>{const data=vrindavanSectionView({rows:[saint("one",[proposal])],sectionCatalogue:sections});assert.equal(data.placements[0].placementState,"Proposed");assert.equal(data.placements[0].familyId,"");assert.equal(data.placements[0].arrangement,undefined);assert.equal(data.sections[0].count,1);});
test("reviewed canonical Gaudiya decisions override inherited geography with explicit provenance",()=>{const data=vrindavanSectionView({rows:[saint("cmq4hd38u00j6dp045lim8o3r",[proposal])],sectionCatalogue:sections});assert.equal(data.placements[0].section,"Gaudiya Vaishnava");assert.match(data.placements[0].note,/Reviewed section correction/);});
test("missing and conflicting proposals remain visible",()=>{const data=vrindavanSectionView({rows:[saint("missing",[]),saint("multiple",[proposal,{...proposal,section:"Gaudiya Vaishnava"}])],sectionCatalogue:sections});assert.equal(data.placements.length,3);assert.equal(data.placements[0].section,"Needs section proposal");assert.equal(data.placements.every(p=>p.needsResearch),true);assert.equal(new Set(data.placements.map(p=>p.id)).size,3);});

test("reviewed Madhu Pandit and Haridas decisions survive selection of published canonical records",()=>{
 for(const id of ["cms0w7dkf01qa07qikm4pbwjx","cms0w7edy02th07qi7gwufj69"]){
  const source={...proposal,section:"Gujarat & Swaminarayan Traditions",tier:"Tertiary"};const before=JSON.stringify(source);
  const data=vrindavanSectionView({rows:[saint(id,[source])],sectionCatalogue:sections});assert.equal(data.placements.length,1);assert.equal(data.placements[0].saintId,id);assert.equal(data.placements[0].section,"Gaudiya Vaishnava");assert.equal(data.placements[0].tier,"Tertiary");assert.equal(data.placements[0].familyId,"");assert.match(data.placements[0].rationale,/Reviewed curator decision/);assert.equal(JSON.stringify(source),before);
 }
});
