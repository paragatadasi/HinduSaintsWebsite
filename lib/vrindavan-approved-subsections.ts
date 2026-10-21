// Museum-local additions explicitly approved by the curator on 21 October 2026.
// These are display subsections, not public tradition labels or exclusive cases.
export const VRINDAVAN_APPROVED_SUBSECTIONS=[
 {name:"Kerala & Southern Advaita",slug:"kerala-and-southern-advaita",region:"The South"},
 {name:"Jaiguru & Omkarnath Lineage",slug:"jaiguru-and-omkarnath-lineage",region:"Bengal, Odisha & the East"},
 {name:"Sahaj Marg & Raja Yoga",slug:"sahaj-marg-and-raja-yoga",region:"Himalaya & the North"}
] as const;
export function vrindavanSubsectionCatalogue<T extends {name:string;slug:string}>(shared:readonly T[]):{name:string;slug:string}[]{
 return [...new Map([...shared,...VRINDAVAN_APPROVED_SUBSECTIONS].map(s=>[s.name,{name:s.name,slug:s.slug}])).values()];
}
