import type {MuseumSaintPlacement} from "./museum-proposals";
export type AcceptedLocality={locality:string;region:string|null;country:string;localityPlaceId:string|null};
const norm=(s:string)=>s.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
// Specific localities precede state-level fallbacks; unknown geography stays reviewable.
export function museumSectionForLocality(place:AcceptedLocality) {
 if(norm(place.country)!=="india") return null;
 const locality=norm(place.locality), region=norm(place.region||"");
 const rules:Array<[string[],string]>=[
  [["vrindavan","vrindavana","brindavan","mathura","barsana","govardhan","radha kund","radhakund","gokul","vraj","braj"],"Braj & Krishna Bhakti"],
  [["mayapur","navadwip","nabadwip","nabadvip"],"Gaudiya Vaishnava"],
  [["puri","jagannath puri"],"Jagannath-Puri & Odisha"],
  [["varanasi","kashi","banaras","prayagraj","allahabad"],"Kashi & Ascetic Lineages"],
  [["rishikesh","haridwar","badrinath","kainchi","kainchi dham","nainital"],"Rishikesh-Haridwar & Himalayan Monastic Lineages"],
  [["ayodhya","chitrakoot"],"Rama & Avadh"],
  [["tiruvannamalai","arunachala"],"Ramana & Arunachala"],
  [["tirumala","tirupati","srirangam"],"Sri Vaishnava & South Indian Vaishnava Traditions"]
 ];
 for(const [names,section] of rules) if(names.includes(locality)) return section;
 const states:Record<string,string>={"maharashtra":"Maharashtra Guru Lineages","odisha":"Jagannath-Puri & Odisha","orissa":"Jagannath-Puri & Odisha","uttarakhand":"Rishikesh-Haridwar & Himalayan Monastic Lineages","tamil nadu":"Shaiva Siddhanta & Tamil Traditions","andhra pradesh":"Andhra Avadhuta & Datta-Advaita Lineages","gujarat":"Gujarat & Swaminarayan Traditions","punjab":"Sikh & Punjab Traditions","west bengal":"Bengal Shakta, Baul & Modern Saints"};
 return states[region]??null;
}
export function applyAcceptedLocalityProposal(row:MuseumSaintPlacement,place:AcceptedLocality|null,protectedFamily=false) {
 if(!place || !place.localityPlaceId || row.tier!=="Tertiary" || protectedFamily) return {...row};
 const section=museumSectionForLocality(place);
 if(!section) return {...row,needsResearch:true,note:[row.note,`Accepted primary locality: ${place.locality}. Museum geography needs a section review.`].filter(Boolean).join(" ")};
 if(section===row.section) return {...row};
 return {...row,section,alternatives:[...new Set([row.section,...row.alternatives])].filter(s=>s!==section),rationale:`Proposed from accepted primary locality ${place.locality}, ${place.country}. Previous proposal: ${row.section}. ${row.rationale}`,note:[row.note,"Locality-driven tertiary proposal; curator confirmation is still required."].filter(Boolean).join(" ")};
}
