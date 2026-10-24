"use client";
import Link from "next/link";
import type {Route} from "next";
import graph from "@/data/museum/spn-connected-traditions.json";
import {MuseumConnectionsWorkspace} from "./museum-connected-traditions";
import {loadSpnDiagramLayoutsAction,saveSpnDiagramLayoutAction,deleteSpnDiagramLayoutAction} from "@/app/museumadmin/plan/actions";
const nodes=graph.regions.flatMap((r,i)=>r.subsections.map(s=>({id:s.existingSlug,name:s.name,region:r.regionSlug,regionIndex:i})));
const actions={load:loadSpnDiagramLayoutsAction,save:saveSpnDiagramLayoutAction,remove:deleteSpnDiagramLayoutAction};
export function SpnConnectedTraditions({sections,canEdit}:{sections:{name:string;slug:string;total:number}[];canEdit:boolean}){
 return <MuseumConnectionsWorkspace graph={graph} diagramNodes={nodes} museumId="museum-spn" actions={actions} section="" onChoose={()=>{}} available={sections.map(s=>s.name)} areas={[]} areaRevision="" canEdit={canEdit} staleAreas={[]} renderSelection={name=>{
 const section=sections.find(s=>s.name===name);
 const relationships=graph.families.filter(f=>f.sections.includes(name));
 return <section className="museum-admin-panel museum-connection-detail" aria-live="polite"><div className="section-heading"><div><p className="eyebrow">Section connections</p><h3>{name||"Explore a section"}</h3>{section?<p>{section.total} current placement entries</p>:null}</div>{section?<Link className="museum-admin-button museum-admin-button--secondary" href={(`/museumadmin/${section.slug}`) as Route}>View section</Link>:null}</div>
 {!name?<p>Select a box to see named relationships and suggestions for keeping related saints together.</p>:relationships.length?<div className="admin-stack">{relationships.map((f,i)=><article key={i} className="museum-connection-detail__relationship"><h4>{f.from.name} {["household","encountered"].includes(f.type)?"↔":"→"} {f.to.name}</h4><p className="eyebrow">{f.type.replaceAll("_"," ")}</p>{"placementSuggestion" in f&&f.placementSuggestion?<p>{f.placementSuggestion}</p>:null}{f.ambiguity?<p>{f.ambiguity}</p>:null}<details><summary>Evidence and context</summary>{f.evidenceNote?<p>{f.evidenceNote}</p>:null}{f.sources.map((source,j)=><p key={j}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></p>)}</details></article>)}</div>:<p>No named relationships are included for this section yet. The connecting lines describe its broader links.</p>}
 </section>;
 }}/>;
}
