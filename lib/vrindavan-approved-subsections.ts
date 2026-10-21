// Museum-local vocabulary for curator-approved placement workflows.
// Neutral regional labels support the locality-first policy without assigning a formal tradition.
// These are display subsections, not public tradition labels or exclusive cases.
export const VRINDAVAN_APPROVED_SUBSECTIONS=[
 {name:"Kerala & Southern Advaita",slug:"kerala-and-southern-advaita",region:"The South"},
 {name:"Jaiguru & Omkarnath Lineage",slug:"jaiguru-and-omkarnath-lineage",region:"Bengal, Odisha & the East"},
 {name:"Sahaj Marg & Raja Yoga",slug:"sahaj-marg-and-raja-yoga",region:"Himalaya & the North"},
 {name:"Karnataka Saints",slug:"karnataka-saints",region:"The South"},
 {name:"Northern Regional Saints",slug:"northern-regional-saints",region:"Himalaya & the North"}
] as const;
export function vrindavanSubsectionCatalogue<T extends {name:string;slug:string}>(shared:readonly T[]):{name:string;slug:string}[]{
 return [...new Map([...shared,...VRINDAVAN_APPROVED_SUBSECTIONS].map(s=>[s.name,{name:s.name,slug:s.slug}])).values()];
}
