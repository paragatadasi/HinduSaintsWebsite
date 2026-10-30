// Curator-supplied cleanup list, 29 October 2026. These notes do not change physical receipts or destinations.
export const spnStarterCleanup = [
 {sourceId:"recPXP5H1JT02Vdhm",name:"Bhakti Bilash Bharati",relic:"Clothes and glasses",destination:"29",note:"Provisional · Gaudiya Math family; precise lineage needs checking."},
 {sourceId:"recQjButx9sSHerz2",name:"Ramprasad of Halisahar",relic:"Meditation-tree material",destination:"24",note:"Eastern Bengali / Shakta display."},
 {sourceId:"recVN6Ty3682Uz2g4",name:"Paramanand Das of Puri",relic:"Yoga-patta arm support",destination:"26",note:"Arm support only · recommended for Puri. Separately housed pieces still need review; do not move the whole record."},
 {sourceId:"recCILjO1fpLxkZ4V",name:"Sanatan Das Babaji",relic:"Dentures",destination:null,note:"Review identity and locality before choosing a destination; no city or teacher in the inventory."},
 {sourceId:"rec3ulkcd4vs7FA6v",name:"Balak Sadhu / Yadav Chandra Rai",relic:"Remaining photographed pieces",destination:"78",note:"Bring the remaining pieces to the existing display.",partial:true},
 {sourceId:"recEs8hxZ2fBFWcEI",name:"Sachinandan Das Babaji",relic:"Asan",destination:"36",note:"Bring the remaining asan to the existing display.",partial:true},
 {sourceId:"recBpkMpvzm57a1J8",name:"Kanupriya Goswami",relic:"Paduka and cloth",destination:"36",note:"Already included in the Northern guide · Basak Para, Navadwip is explicit on the label."},
];
export function starterCleanupPartial(sourceId:string){return spnStarterCleanup.some(item=>item.sourceId===sourceId&&item.partial);}
