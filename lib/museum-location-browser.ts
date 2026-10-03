import type { MuseumSaintPlacement } from "./museum-proposals";

export type LocationInventoryItem = {
  id: string; label: string; inventoryCode: string | null;
  saints: { id: string; name: string }[];
  location: { code: string; label: string; museumId: string } | null;
  plannedLocation: { label: string; museumId: string } | null;
};
export type LocationBrowserRow = {
  key: string; label: string; itemId?: string; inventoryCode?: string | null;
  saints: { id: string; name: string }[];
  locationLabel: string; vitrine: string; shelf: string;
  arrangements: string[]; sections: string[]; plannedLocation: string | null; sourceOnly: boolean;
};

// Current inventory and unverified source hints stay distinct. One item shared
// by several saints remains one item, and conflicting destinations stay visible.
export function buildLocationBrowserRows(items: LocationInventoryItem[], placements: MuseumSaintPlacement[]): LocationBrowserRow[] {
  const destinations = new Map<string, Set<string>>();
  for (const row of placements) if (row.saintId) {
    const sections = destinations.get(row.saintId) || new Set<string>();
    sections.add(row.section); destinations.set(row.saintId, sections);
  }
  const arrangements = (ids:string[]) => [...new Set(placements.filter(p=>p.saintId&&ids.includes(p.saintId)&&p.arrangement?.vitrine).map(p=>p.name+": "+p.arrangement!.status+" · Vitrine "+p.arrangement!.vitrine+(p.arrangement!.shelf?" / Shelf "+p.arrangement!.shelf:"")))];
  const sectionNames = (ids: string[]) => [...new Set(ids.flatMap(id => [...(destinations.get(id) || [])]))].sort();
  const rows: LocationBrowserRow[] = items.map(item => {
    const code = item.location?.museumId === "museum-spn" ? item.location.code : "";
    const match = /^([1-9][0-9]*)(?:\/([A-Z0-9]{1,8}))?$/.exec(code);
    return {
      key: "item:" + item.id, itemId: item.id, label: item.label, inventoryCode: item.inventoryCode,
      saints: item.saints, locationLabel: item.location?.label || "Location unknown",
      vitrine: match?.[1] || "", shelf: match?.[2] || "",
      sections: sectionNames(item.saints.map(s => s.id)), arrangements:arrangements(item.saints.map(s=>s.id)),
      plannedLocation: item.plannedLocation?.label || null, sourceOnly: false
    };
  });
  const inventoried = new Set(items.flatMap(item => item.saints.map(s => s.id)));
  const included = new Set<string>();
  for (const placement of placements) {
    const id = placement.saintId;
    if (!id || inventoried.has(id) || included.has(id) || !placement.sourceVitrine) continue;
    included.add(id);
    const source = placement.sourceVitrine;
    rows.push({ key: "source:" + id, label: placement.name, saints: [{ id, name: placement.name }],
      locationLabel: "Vitrine " + source.vitrine + (source.shelf ? " / Shelf " + source.shelf : ""),
      vitrine: source.vitrine, shelf: source.shelf || "", sections: sectionNames([id]),
      arrangements:arrangements([id]), plannedLocation: null, sourceOnly: true });
  }
  return rows.sort((a,b) => a.vitrine.localeCompare(b.vitrine, undefined, {numeric:true}) || a.shelf.localeCompare(b.shelf, undefined, {numeric:true}) || a.label.localeCompare(b.label));
}

export function filterLocationBrowserRows(rows: LocationBrowserRow[], filters: { vitrine?: string; shelf?: string; section?: string; q?: string }) {
  const term = (filters.q || "").trim().toLocaleLowerCase();
  return rows.filter(row => (!filters.vitrine || (filters.vitrine === "unknown" ? !row.vitrine : row.vitrine === filters.vitrine))
    && (!filters.shelf || (filters.shelf === "unspecified" ? !row.shelf : row.shelf === filters.shelf))
    && (!filters.section || row.sections.includes(filters.section))
    && (!term || [row.label, row.inventoryCode || "", ...row.saints.map(s=>s.name)].some(value=>value.toLocaleLowerCase().includes(term))));
}
