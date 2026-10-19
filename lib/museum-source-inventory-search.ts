import type { MuseumSourceInventoryEntry } from "./museum-source-inventory-domain";
import {buildSaintSearchFields,type SearchableSaint} from "./saint-search";
import {rankWeightedTextSearch} from "./search-text";
export type SourceInventorySaint = Pick<SearchableSaint,"displayName"|"canonicalName"|"aliases"> & {id:string};
export function filterSourceInventory(entries:MuseumSourceInventoryEntry[], saints:SourceInventorySaint[], filters:{q:string;display:string;position:string}) {
 const fields=new Map(saints.map(s=>[s.id,buildSaintSearchFields(s)]));
 const scoped=entries.filter(entry=>(!filters.display || (filters.display==="unrecorded"?!entry.displayText.trim():entry.displayText.trim()===filters.display))
  && (!filters.position || (filters.position==="unrecorded"?!entry.positionText.trim():entry.positionText.trim()===filters.position)));
 if(!filters.q.trim())return scoped;
 // Search only entries already admitted by the museum's reviewed inventory reader.
 // Reuse site matching and name weights, with private source evidence as extra fields.
 return rankWeightedTextSearch(scoped,filters.q,entry=>[
  ...entry.saintIds.flatMap(id=>fields.get(id)||[]),
  {value:entry.sourceSaintName,weight:6,fuzzy:true},
  {value:entry.relicDescription,weight:1.5},
  {value:entry.sourcePlaceText,weight:1.5}
 ]).map(({item})=>item);
}
