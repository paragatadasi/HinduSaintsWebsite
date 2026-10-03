"use client";
import {useId,useState} from "react";
import {CircleAlert} from "lucide-react";
import type {MuseumSourceInventoryEntry} from "@/lib/museum-source-inventory-domain";
import type {MuseumSaintProfile as Profile} from "@/lib/museum-saint-profile";
import {MuseumDetailDialog} from "@/components/admin/museum-detail-dialog";
import {MuseumSaintProfile} from "@/components/admin/museum-saint-profile";

export function MuseumSourceInventoryCards({entries,profiles,names}:{entries:MuseumSourceInventoryEntry[];profiles:Record<string,Profile>;names:Record<string,string>}) {
 const [selected,setSelected]=useState<string|null>(null);
 const entry=entries.find(e=>e.observationId===selected);
 const title=(e:MuseumSourceInventoryEntry)=>e.saintIds.map(id=>names[id]).filter(Boolean).join(" · ") || e.sourceSaintName || "Saint identity unavailable";
 return <><div className="museum-source-inventory-grid">{entries.map(row=><button key={row.observationId} type="button" className="museum-source-inventory-card interactive-surface" aria-haspopup="dialog" onClick={()=>setSelected(row.observationId)}>
  <span className="museum-source-inventory-card__heading"><strong>{title(row)}</strong>{row.warnings.length?<CircleAlert aria-label="Source notes need attention" size={16}/>:null}</span>
  <span>{row.relicDescription || "Relic description not recorded"}</span>
  <span className="museum-source-inventory-card__location">{row.sourceLocation?.label || "Source location not recorded"}</span>
  {row.quantityText?<small>Quantity: {row.quantityText}</small>:null}
  <small className="museum-card-status">Source record</small>
 </button>)}</div>{entry?<InventoryDialog key={entry.observationId} entry={entry} profiles={profiles} title={title(entry)} onClose={()=>setSelected(null)}/>:null}</>;
}
function InventoryDialog({entry,profiles,title,onClose}:{entry:MuseumSourceInventoryEntry;profiles:Record<string,Profile>;title:string;onClose:()=>void}) {
 const titleId=useId();
 return <MuseumDetailDialog titleId={titleId} kicker="Vrindavan inventory" closeLabel="Close inventory entry" onClose={onClose}>
  <h2 id={titleId} className="sr-only">{title}</h2>
  {entry.saintIds.map(id=>profiles[id]?<MuseumSaintProfile key={id} profile={profiles[id]} titleId={`${titleId}-${id}`}/>:null)}
  {!entry.saintIds.some(id=>profiles[id])?<h2>{title}</h2>:null}
  <section className="museum-saint-review-section"><h3>Relics and source location</h3>
   <p className="muted">The saint identity has been reviewed. Relic details and locations below are source-reported; this entry may describe several objects.</p>
   <dl className="museum-saint-data museum-saint-data--flat"><Fact label="Relics" value={entry.relicDescription||"Not recorded"}/><Fact label="Quantity" value={entry.quantityText||"Not recorded"}/><Fact label="Packaging" value={entry.packagingText}/><Fact label="Display / vitrine" value={entry.displayText||"Not recorded"}/><Fact label="Shelf / position" value={entry.positionText||"Not recorded"}/><Fact label="Source place" value={entry.sourcePlaceText}/></dl>
  </section>
  {entry.comments?<section className="museum-saint-review-section"><h3>Curator notes from the source</h3><p className="museum-source-note">{entry.comments}</p></section>:null}
  {entry.warnings.length?<section className="museum-saint-review-section"><h3>Needs attention</h3><ul>{entry.warnings.map((warning,i)=><li key={i}>{warning}</li>)}</ul></section>:null}
  <details className="museum-saint-review-section"><summary>Source details</summary><dl className="museum-saint-data museum-saint-data--flat"><Fact label="Workbook" value={entry.sourceName}/><Fact label="Row" value={String(entry.sourceRow)}/><Fact label="Original saint name" value={entry.sourceSaintName||"Not recorded"}/></dl></details>
 </MuseumDetailDialog>;
}
function Fact({label,value}:{label:string;value?:string}) {return value?<div><dt>{label}</dt><dd>{value}</dd></div>:null}
