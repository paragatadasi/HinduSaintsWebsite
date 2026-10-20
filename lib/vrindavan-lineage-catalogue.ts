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
