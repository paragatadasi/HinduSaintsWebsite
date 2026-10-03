import type { MuseumSourceInventoryEntry } from "./museum-source-inventory-domain";
export type SourceInventorySaint = {id:string;displayName:string;canonicalName:string};
export function filterSourceInventory(entries:MuseumSourceInventoryEntry[], saints:SourceInventorySaint[], filters:{q:string;display:string;position:string}) {
 const names=new Map(saints.map(s=>[s.id,[s.displayName,s.canonicalName].join(" ")]));
 const term=filters.q.trim().toLocaleLowerCase();
 return entries.filter(entry=>(!filters.display || (filters.display==="unrecorded"?!entry.displayText.trim():entry.displayText.trim()===filters.display))
  && (!filters.position || (filters.position==="unrecorded"?!entry.positionText.trim():entry.positionText.trim()===filters.position))
  && (!term || [entry.sourceSaintName||"",entry.relicDescription,entry.sourcePlaceText,...entry.saintIds.map(id=>names.get(id)||"")].some(text=>text.toLocaleLowerCase().includes(term))));
}
