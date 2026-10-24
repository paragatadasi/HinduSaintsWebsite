"use client";
import {useState} from "react";
import type {LocationBrowserRow} from "@/lib/museum-location-browser";

export type MuseumPortraits = Record<string, {url: string}>;
function Portrait({url}: {url?: string}) {
  const [failed, setFailed] = useState(false);
  return url && !failed ? <img className="museum-contents-portrait" src={url} alt="" loading="lazy" width={64} height={80} onError={() => setFailed(true)}/> : <span className="museum-contents-portrait museum-contents-portrait--empty" aria-hidden="true"/>;
}
export function MuseumPortraitContents({rows, portraits}: {rows: LocationBrowserRow[]; portraits: MuseumPortraits}) {
  const mixed = rows.some(r => r.sourceOnly) && rows.some(r => !r.sourceOnly);
  const shelves = [...new Set(rows.map(r => r.shelf))].sort((a,b) => a ? b ? a.localeCompare(b, undefined, {numeric:true}) : -1 : 1);
  return <div className="museum-contents">{shelves.map(shelf => <section key={shelf}>
    <h3>{shelf ? "Shelf " + shelf : "Shelf not recorded"}</h3>
    <ul>{rows.filter(r => r.shelf === shelf).map(row => {
      // A shared relic must not acquire one person's portrait as its identity.
      const portrait = row.saints.length === 1 ? portraits[row.saints[0].id] : undefined;
      return <li key={row.key}><Portrait key={portrait?.url || row.key} url={portrait?.url}/><div><h4>{row.label}</h4>{row.sections.length ? <p>{row.sections.join(" · ")}</p> : null}{mixed ? <p>{row.sourceOnly ? "Source record" : "Inventory item"}</p> : null}</div></li>;
    })}</ul>
  </section>)}</div>;
}
