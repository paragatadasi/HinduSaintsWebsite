import {MuseumInventoryFilters} from "@/components/admin/museum-inventory-filters";
import Link from "next/link";
import type { Route } from "next";
import { filterLocationBrowserRows, type LocationBrowserRow } from "@/lib/museum-location-browser";

export function MuseumLocationBrowser({rows, sections, filters, pageNumber="1"}:{rows:LocationBrowserRow[];sections:{name:string;slug:string}[];filters:{vitrine:string;shelf:string;section:string;q:string};pageNumber?:string}) {
  const matches = filterLocationBrowserRows(rows,filters);
  const page = Math.max(1, Math.min(Math.max(1, Math.ceil(matches.length / 30)), parseInt(pageNumber, 10) || 1));
  const visible = matches.slice((page - 1) * 30, page * 30);
  const pageHref = (next:number) => `/museumadmin/locations?${new URLSearchParams({...filters,page:String(next)})}` as Route;
  const vitrines = [...new Set(rows.map(r=>r.vitrine).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  const shelves = [...new Set(rows.filter(r=>!filters.vitrine||r.vitrine===filters.vitrine).map(r=>r.shelf).filter(Boolean))].sort();
  const sectionSlug = new Map(sections.map(s=>[s.name,s.slug]));
  return <div className="museum-admin admin-stack">
    <header><div className="eyebrow">SPN Museum</div><h1>Vitrines and shelves</h1><p>See where relics are recorded now and which sections their saints belong to in the working arrangement.</p></header>
    <MuseumInventoryFilters action="/museumadmin/locations" query={filters.q} searchLabel="Saint or relic" submitLabel="Show locations" filters={[
      {name:"vitrine",label:"Vitrine",value:filters.vitrine,allLabel:"All vitrines",options:[...vitrines.map(v=>({value:v,label:"Vitrine "+v})),{value:"unknown",label:"Unknown or other location"}]},
      {name:"shelf",label:"Shelf",value:filters.shelf,allLabel:"All shelves",options:[...shelves.map(s=>({value:s,label:s})),{value:"unspecified",label:"Shelf not recorded"}]},
      {name:"section",label:"Destination section",value:filters.section,allLabel:"All sections",options:sections.map(s=>({value:s.name,label:s.name}))}
    ]}/>

    <p role="status">{matches.filter(r=>!r.sourceOnly).length} relic records · {matches.filter(r=>r.sourceOnly).length} source-only saint locations</p>
    {!matches.length?<p>No locations match these filters.</p>:null}
    <div className="museum-location-list">{visible.map(row=><article key={row.key} className="museum-admin-panel">
      <div className="museum-admin-section-heading"><h2>{row.itemId?<Link href={`/museumadmin/collections/${row.itemId}` as Route}>{row.label}</Link>:row.label}</h2>{row.sourceOnly?<small>Inventory incomplete</small>:null}</div>
      <dl className="museum-saint-data museum-saint-data--flat">
        <div><dt>{row.sourceOnly?"Source location · not verified":"Current recorded location"}</dt><dd>{row.locationLabel}</dd></div>
        <div><dt>Working section{row.sections.length>1?"s":""}</dt><dd>{row.sections.length?row.sections.map((section,i)=><span key={section}>{i?" · ":""}<Link href={`/museumadmin/${sectionSlug.get(section)}` as Route}>{section}</Link></span>):"No section proposal recorded"}</dd></div>
        {row.arrangements.length?<div><dt>Saint arrangements · curator recorded</dt><dd>{row.arrangements.join("; ")}</dd></div>:null}
        {row.plannedLocation?<div><dt>Individual relic move plan</dt><dd>{row.plannedLocation}</dd></div>:null}
      </dl>
      {!row.sourceOnly?<p>{row.saints.map((saint,i)=><span key={saint.id}>{i?" · ":""}<Link href={`/museumadmin?q=${encodeURIComponent(saint.name)}` as Route}>{saint.name}</Link></span>)}{!row.saints.length?"No saint linked":null}</p>:<p>This location comes from the source record. Individual relics have not yet been connected.</p>}
      {row.itemId?<Link href={`/museumadmin/collections/${row.itemId}` as Route}>Open relic and move details</Link>:<Link href={`/museumadmin?q=${encodeURIComponent(row.label)}` as Route}>Open saint search</Link>}
    </article>)}</div>
    {matches.length>30?<nav className="review-actions" aria-label="Location pages">{page>1?<Link href={pageHref(page-1)}>Previous</Link>:null}<span>Page {page} of {Math.ceil(matches.length/30)}</span>{page*30<matches.length?<Link href={pageHref(page+1)}>Next</Link>:null}</nav>:null}
  </div>;
}
