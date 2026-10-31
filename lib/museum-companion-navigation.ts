export const companionRows = [
 {value:"starter",label:"Gaudiya East",phases:["starter"]},
 {value:"datta",label:"Datta",phases:["datta"]},
 {value:"ram-bhakti",label:"Ram bhakti",phases:["ram-bhakti"]},
 {value:"east",label:"East",phases:["gosaiji-sai","east2"]},
 {value:"vraj",label:"Vraj",phases:["vraj","vraj2"]},
 {value:"north",label:"Northern journey",phases:["north"]},
 {value:"west",label:"West",phases:["west45","west1"]},
] as const;
export type CompanionPhase = typeof companionRows[number]["phases"][number];
export type CompanionRowKey = typeof companionRows[number]["value"];
export function companionRowForPhase(phase:CompanionPhase){
 return companionRows.find(row=>row.phases.some(member=>member===phase))!;
}
