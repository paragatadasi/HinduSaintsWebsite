import {MuseumInventoryFilters} from "@/components/admin/museum-inventory-filters";
import Link from "next/link";
import type {Route} from "next";
import {requireCapability} from "@/lib/admin-access";
import {readVrindavanMuseumInventory,MuseumInventoryUnavailableError} from "@/lib/vrindavan-museum-inventory";
import {readMuseumSaintProfiles} from "@/lib/museum-saint-profiles";
import {filterSourceInventory} from "@/lib/museum-source-inventory-search";
import {MuseumSourceInventoryCards} from "@/components/admin/museum-source-inventory-cards";

export default async function VrindavanInventory({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 await requireCapability("access_museum");const params=await searchParams;
 const value=(key:string)=>typeof params[key]==="string"?params[key].trim().slice(0,200):"";
 const filters={q:value("q"),display:value("display"),position:value("position")};
 let data: Awaited<ReturnType<typeof readVrindavanMuseumInventory>>;
 try { data=await readVrindavanMuseumInventory(); } catch(error) {
  if(error instanceof MuseumInventoryUnavailableError) return <div className="admin-stack"><h1>Vrindavan inventory</h1><p>This museum workspace is not available yet. A source administrator can check the museum setup.</p></div>;
  throw error;
 }
 const matches=filterSourceInventory(data.entries,data.saints,filters);
 const page=Math.max(1,Math.min(Math.max(1,Math.ceil(matches.length/30)),parseInt(value("page"),10)||1));
 const visible=matches.slice((page-1)*30,page*30);
 const profiles=await readMuseumSaintProfiles([...new Set(visible.flatMap(entry=>entry.saintIds))]);
 const positions=[...new Set(data.entries.filter(e=>!filters.display||e.displayText.trim()===filters.display).map(e=>e.positionText.trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 const pageHref=(next:number)=>`/vrindavanadmin?${new URLSearchParams({...filters,page:String(next)})}` as Route;
 return <div className="museum-admin admin-stack">
  <header><div className="eyebrow">Vrindavan Museum</div><h1>Relics and locations</h1><p>Find a saint or explore the displays. Open a card for photographs, biography, relic details and source notes.</p></header>
  <p><Link className="museum-admin-button" href={"/vrindavanadmin/sections" as Route}>Explore section proposals</Link></p>
  <MuseumInventoryFilters action="/vrindavanadmin" query={filters.q} searchLabel="Saint, relic or place" submitLabel="Find inventory" filters={[
    {name:"display",label:"Display / vitrine",value:filters.display,allLabel:"All displays",options:[...data.displays.map(display=>({value:display,label:display})),{value:"unrecorded",label:"Not recorded"}]},
    {name:"position",label:"Shelf / position",value:filters.position,allLabel:"All positions",options:[...positions.map(position=>({value:position,label:position})),{value:"unrecorded",label:"Not recorded"}]}
  ]}/>

  <p role="status">{matches.length} inventory {matches.length===1?"entry":"entries"}</p>
  <details><summary>Inventory coverage and source information</summary><p>{data.counts.confirmedEntries} entries have reviewed saint identities, covering {data.counts.linkedSaints} saints. {data.counts.awaitingIdentityReview} entries await identity review.</p><p>Locations and quantities are taken from the source inventory. Each entry may describe more than one relic; it is not a count of verified individual objects. Section proposals are available for discussion; physical move recording will follow separately.</p>{data.counts.unavailableIdentityEntries||data.counts.malformedConfirmedEntries?<p>Some reviewed entries need additional identity or source cleanup.</p>:null}</details>
  {!matches.length?<p>{data.entries.length?"No entries match these filters.":"No reviewed inventory entries are available yet."}</p>:null}
  <MuseumSourceInventoryCards entries={visible} profiles={profiles} names={Object.fromEntries(data.saints.map(s=>[s.id,s.displayName]))}/>
  {matches.length>30?<nav className="review-actions" aria-label="Inventory pages">{page>1?<Link href={pageHref(page-1)}>Previous</Link>:null}<span>Page {page} of {Math.ceil(matches.length/30)}</span>{page*30<matches.length?<Link href={pageHref(page+1)}>Next</Link>:null}</nav>:null}
 </div>;
}
