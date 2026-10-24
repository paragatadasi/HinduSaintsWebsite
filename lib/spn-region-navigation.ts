import {museumFlowZones} from "./museum-layout-groups";
// Approved SPN regional headings (Saarthi, 24 October 2026).
// Navigation only: subsection identities and per-saint decisions remain unchanged.
export const SPN_REGION_GROUPS = [
  {
    "title": "Himalaya & the North",
    "eyebrow": "Region",
    "badge": "01",
    "summary": "Related traditions, with existing families kept together.",
    "sections": [
      "Rishikesh-Haridwar & Himalayan Monastic Lineages"
    ]
  },
  {
    "title": "Sikh Gurus & Udasin",
    "eyebrow": "Region",
    "badge": "02",
    "summary": "Related traditions, with existing families kept together.",
    "sections": [
      "Sikh & Punjab Traditions",
      "Udasin Saints"
    ]
  },
  {
    "title": "Braj & the Ganga",
    "eyebrow": "Region",
    "badge": "03",
    "summary": "Related traditions, with existing families kept together.",
    "sections": [
      "Gaudiya Vaishnava",
      "Ramanandi",
      "Rama & Avadh",
      "Braj & Krishna Bhakti",
      "Kashi & Ascetic Lineages"
    ]
  },
  {
    "title": "Bengal, Odisha & the East",
    "eyebrow": "Region",
    "badge": "04",
    "summary": "Related traditions, with existing families kept together.",
    "sections": [
      "Jagannath-Puri & Odisha",
      "Bengal Shakta, Baul & Modern Saints",
      "Buddhist Saints"
    ]
  },
  {
    "title": "Maharashtra & the West",
    "eyebrow": "Region",
    "badge": "05",
    "summary": "Related traditions, with existing families kept together.",
    "sections": [
      "Varkari",
      "Datta Tradition",
      "Girnar & Nath Traditions",
      "Maharashtra Guru Lineages",
      "Gujarat & Swaminarayan Traditions"
    ]
  },
  {
    "title": "The South",
    "eyebrow": "Region",
    "badge": "06",
    "summary": "Related traditions, with existing families kept together.",
    "sections": [
      "Ramana & Arunachala",
      "Sri Vaishnava & South Indian Vaishnava Traditions",
      "Shaiva Siddhanta & Tamil Traditions",
      "Andhra Avadhuta & Datta-Advaita Lineages"
    ]
  },
  {
    "title": "Bhakti Marga & Global Context",
    "eyebrow": "Supplementary context",
    "badge": "S",
    "summary": "Living lineage and global context beyond the six regions.",
    "sections": [
      "Bhakti Marga & Mauritius Lineage",
      "Global & Diaspora Lineages"
    ]
  }
] as const;

export function spnRegionGroups(sections: {name:string}[]) {
 const available=new Set(sections.map(section=>section.name));
 const ranks=new Map<string,number>(museumFlowZones.flatMap(group=>[...group.sections]).map((name,index)=>[name,index]));
 const groups=SPN_REGION_GROUPS.map(group=>({...group,sections:group.sections.filter(name=>available.has(name)).sort((a,b)=>(ranks.get(a)??Number.MAX_SAFE_INTEGER)-(ranks.get(b)??Number.MAX_SAFE_INTEGER)) as string[]})).filter(group=>group.sections.length);
 const grouped=new Set(groups.flatMap(group=>group.sections));
 const unresolved=sections.filter(section=>!grouped.has(section.name)).map(section=>section.name);
 return [...groups,...(unresolved.length?[{title:"Needs review",eyebrow:"Review queue",badge:"R",summary:"Proposals awaiting research or a section decision.",sections:unresolved}]:[])];
}
