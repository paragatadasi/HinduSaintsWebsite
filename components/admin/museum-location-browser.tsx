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
    <form className="museum-location-filters" action="/museumadmin/locations">
      <label className="admin-field">Vitrine<select name="vitrine" defaultValue={filters.vitrine}><option value="">All vitrines</option>{vitrines.map(v=><option key={v} value={v}>Vitrine {v}</option>)}<option value="unknown">Unknown or other location</option></select></label>
      <label className="admin-field">Shelf<select name="shelf" defaultValue={filters.shelf}><option value="">All shelves</option>{shelves.map(s=><option key={s} value={s}>{s}</option>)}<option value="unspecified">Shelf not recorded</option></select></label>
      <label className="admin-field">Destination section<select name="section" defaultValue={filters.section}><option value="">All sections</option>{sections.map(s=><option key={s.slug} value={s.name}>{s.name}</option>)}</select></label>
      <label className="admin-field">Saint or relic<input name="q" defaultValue={filters.q} type="search"/></label>
      <div className="review-actions"><button className="museum-admin-button">Show locations</button><Link href={"/museumadmin/locations" as Route}>Clear filters</Link></div>
    </form>
    <p role="status">{matches.filter(r=>!r.sourceOnly).length} relic records · {matches.filter(r=>r.sourceOnly).length} source-only saint locations</p>
    {!matches.length?<p>No locations match these filters.</p>:null}
    <div className="museum-location-list">{visible.map(row=><article key={row.key} className="museum-admin-panel">
      <div className="museum-admin-section-heading"><h2>{row.itemId?<Link href={`/museumadmin/collections/${row.itemId}` as Route}>{row.label}</Link>:row.label}</h2>{row.sourceOnly?<small>Inventory incomplete</small>:null}</div>
      <dl className="museum-saint-data museum-saint-data--flat">
        <div><dt>{row.sourceOnly?"Source location · not verified":"Current recorded location"}</dt><dd>{row.locationLabel}</dd></div>
        <div><dt>Working section{row.sections.length>1?"s":""}</dt><dd>{row.sections.length?row.sections.map((section,i)=><span key={section}>{i?" · ":""}<Link href={`/museumadmin/${sectionSlug.get(section)}` as Route}>{section}</Link></span>):"No section proposal recorded"}</dd></div>
        {row.plannedLocation?<div><dt>Planned destination</dt><dd>{row.plannedLocation}</dd></div>:null}
      </dl>
      {!row.sourceOnly?<p>{row.saints.map((saint,i)=><span key={saint.id}>{i?" · ":""}<Link href={`/museumadmin?q=${encodeURIComponent(saint.name)}` as Route}>{saint.name}</Link></span>)}{!row.saints.length?"No saint linked":null}</p>:<p>This location comes from the source record. Individual relics have not yet been connected.</p>}
      {row.itemId?<Link href={`/museumadmin/collections/${row.itemId}` as Route}>Open relic and move details</Link>:<Link href={`/museumadmin?q=${encodeURIComponent(row.label)}` as Route}>Open saint search</Link>}
    </article>)}</div>
    {matches.length>30?<nav className="review-actions" aria-label="Location pages">{page>1?<Link href={pageHref(page-1)}>Previous</Link>:null}<span>Page {page} of {Math.ceil(matches.length/30)}</span>{page*30<matches.length?<Link href={pageHref(page+1)}>Next</Link>:null}</nav>:null}
  </div>;
}
