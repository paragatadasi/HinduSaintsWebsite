import {VRINDAVAN_VISITOR_SEQUENCE} from "./vrindavan-visitor-flow";
// Museum-local navigation vocabulary; never rename the shared SPN catalogue.
export const LINEAGE_VERSION="vrindavan-lineage-first-section-proposal-2026-10-20-v2";
export const LINEAGE_QUEUE="Needs section proposal";
export const LINEAGE_REGIONS=[
 {name:"Himalaya & the North",slug:"himalaya-and-the-north",order:1},
 {name:"Sikh Gurus & Udasin",slug:"sikh-gurus-and-udasin",order:2},
 {name:"Braj & the Ganga",slug:"braj-and-the-ganga",order:3},
 {name:"Bengal, Odisha & the East",slug:"bengal-odisha-and-the-east",order:4},
 {name:"Maharashtra & the West",slug:"maharashtra-and-the-west",order:5},
 {name:"The South",slug:"the-south",order:6}
];
export const LINEAGE_SUPPLEMENT={name:"Bhakti Marga & Global Context",slug:"bhakti-marga-and-global-context"};
export const isLineageTarget=(name:string)=>LINEAGE_REGIONS.some(s=>s.name===name)||name===LINEAGE_SUPPLEMENT.name;

// Regions are navigation parents; these names remain real subsection identities.
export const VRINDAVAN_SUBSECTION_PARENTS:Record<string,string>={
 "Gaudiya Vaishnava": "Braj & the Ganga",
 "Varkari": "Maharashtra & the West",
 "Datta Tradition": "Maharashtra & the West",
 "Ramanandi": "Braj & the Ganga",
 "Rama & Avadh": "Braj & the Ganga",
 "Braj & Krishna Bhakti": "Braj & the Ganga",
 "Jagannath-Puri & Odisha": "Bengal, Odisha & the East",
 "Kashi & Ascetic Lineages": "Braj & the Ganga",
 "Rishikesh-Haridwar & Himalayan Monastic Lineages": "Himalaya & the North",
 "Girnar & Nath Traditions": "Maharashtra & the West",
 "Maharashtra Guru Lineages": "Maharashtra & the West",
 "Ramana & Arunachala": "The South",
 "Sri Vaishnava & South Indian Vaishnava Traditions": "The South",
 "Shaiva Siddhanta & Tamil Traditions": "The South",
 "Andhra Avadhuta & Datta-Advaita Lineages": "The South",
 "Gujarat & Swaminarayan Traditions": "Maharashtra & the West",
 "Sikh & Punjab Traditions": "Sikh Gurus & Udasin",
 "Bengal Shakta, Baul & Modern Saints": "Bengal, Odisha & the East",
 "Buddhist Saints": "Bengal, Odisha & the East",
 "Udasin Saints": "Sikh Gurus & Udasin",
 "Bhakti Marga & Mauritius Lineage": "Bhakti Marga & Global Context",
 "Global & Diaspora Lineages": "Bhakti Marga & Global Context",
 "Needs Research": ""
};
export function vrindavanRegionGroups(sections:{name:string;total?:number;count?:number}[]){
 const groups=VRINDAVAN_VISITOR_SEQUENCE.map(sequence=>{
  const region=LINEAGE_REGIONS.find(r=>r.slug===sequence.regionSlug)!;
  const ranks=new Map<string,number>(sequence.subsections.map((name,index)=>[name,index]));
  const names=sections.filter(s=>VRINDAVAN_SUBSECTION_PARENTS[s.name]===region.name).map(s=>s.name).sort((a,b)=>(ranks.get(a)??Number.MAX_SAFE_INTEGER)-(ranks.get(b)??Number.MAX_SAFE_INTEGER)||a.localeCompare(b));
  return {title:region.name,eyebrow:"Region",badge:String(sequence.visitorOrder).padStart(2,"0"),visitorOrder:Number(sequence.visitorOrder),bookChapterReference:Number(sequence.bookChapterReference),summary:"Existing subsections retain their families and saints.",sections:names};
 });
 const context=sections.filter(s=>VRINDAVAN_SUBSECTION_PARENTS[s.name]===LINEAGE_SUPPLEMENT.name&&(s.total??s.count??0)>0).map(s=>s.name).sort((a,b)=>["Bhakti Marga & Mauritius Lineage","Global & Diaspora Lineages"].indexOf(a)-["Bhakti Marga & Mauritius Lineage","Global & Diaspora Lineages"].indexOf(b));
 if(context.length)groups.push({title:LINEAGE_SUPPLEMENT.name,eyebrow:"Supplementary context",badge:"S",visitorOrder:0,bookChapterReference:0,summary:"Project and global context outside the six regions.",sections:context});
 return groups;
}
export function assertVrindavanHierarchyApplyReady():never{throw new Error("Region-only section replacement is disabled. Preserve subsections and review regional-parent exceptions separately.");}
