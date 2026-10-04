"use client";
import {useEffect,useId,useRef,useState} from "react";
import type {MuseumSection} from "@/lib/museum-proposals";
import type {MuseumLiveTree} from "@/lib/museum-live-tree";
import {TREE_GEOMETRY,treeNameLines} from "@/lib/museum-tree-layout";
import {Triangle} from "lucide-react";
import {MuseumDetailDialog} from "./museum-detail-dialog";
import {MuseumSaintProfile} from "./museum-saint-profile";

const presenceLabels={location:"Recorded location",catalogue:"Collection record",source:"Source inventory",none:"Not recorded here"};
type TreeOption={key:string;label:string;seeds:string[];count:number;familyKey?:string};
export function MuseumLiveTrees({section,museum}:{section:MuseumSection;museum:"spn"|"vrindavan"}) {
 // Keep unlinked source families visible so comparison never silently loses a tree.
 const groups:TreeOption[]=section.families.map(f=>({key:f.key,familyKey:f.key,label:f.label,seeds:[...new Set(f.rows.flatMap(r=>r.saintId?[r.saintId]:[]))],count:f.rows.length}));
 const covered=new Set(section.families.flatMap(f=>f.rows.map(r=>r.id)));
 const options=[...groups,...section.rows.filter(r=>r.saintId&&!covered.has(r.id)).map(r=>({key:r.id,label:r.name,seeds:[r.saintId!],count:1}))];
 return <section className="museum-admin-panel">
  <div className="museum-admin-kicker">Live relationship trees · Preview</div><h2>Compare with the original diagrams</h2>
  <p>Open any family to generate its tree. Keep multiple trees open for comparison. Preserved export connections are labeled reference evidence where website relationships are missing; no records are changed.</p>
  <div className="museum-tree-grid">{options.map(option=><MuseumLiveTreePanel key={option.key} option={option} museum={museum}/>)}</div>
  {!options.length?<p>No families or linked saints are available in this section yet.</p>:null}
 </section>;
}
export function MuseumLiveTreePanel({option,museum}:{option:TreeOption;museum:"spn"|"vrindavan"}) {
 const [data,setData]=useState<MuseumLiveTree|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(false);
 const [unreviewed,setUnreviewed]=useState(true),[source,setSource]=useState(Boolean(option.familyKey));
 const controller=useRef<AbortController|null>(null),started=useRef(false);
 useEffect(()=>()=>controller.current?.abort(),[]);
 async function load(pending=unreviewed,reference=source){
  started.current=true;controller.current?.abort();const request=new AbortController();controller.current=request;setLoading(true);setError("");setData(null);
  try{const response=await fetch("/api/admin/museum/relationship-tree",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({museum,seeds:option.seeds.slice(0,60),familyKey:option.familyKey,includeUnreviewed:pending,includeSource:reference}),signal:request.signal});const result=await response.json();if(!response.ok)throw Error(result.error||"Unable to load tree.");if(!request.signal.aborted)setData(result);}
  catch(e){if(!request.signal.aborted)setError(e instanceof Error?e.message:"Unable to load tree.");}finally{if(!request.signal.aborted)setLoading(false);}
 }
 return <details className="museum-tree-panel" onToggle={event=>{if(event.currentTarget.open&&!started.current)void load();}}>
  <summary><span className="museum-tree-panel__title">{option.label}<Triangle aria-hidden="true" className="museum-tree-panel__toggle"/></span><small>{option.count} saints</small></summary>
  <div className="museum-live-tree-content admin-stack">
   <div className="review-actions">
    <button className="museum-admin-button museum-admin-button--secondary" disabled={loading} type="button" onClick={()=>void load()}>Refresh tree</button>
    <label><input type="checkbox" checked={unreviewed} onChange={e=>{setUnreviewed(e.target.checked);void load(e.target.checked,source);}}/> Include website relationships awaiting review</label>
    {option.familyKey?<label><input type="checkbox" checked={source} onChange={e=>{setSource(e.target.checked);void load(unreviewed,e.target.checked);}}/> Show preserved export relationships</label>:null}
   </div>
   {option.seeds.length>60?<p>Starting from the first 60 linked members; the graph may be a partial family view.</p>:null}
   {loading?<p role="status">Generating tree…</p>:null}{error?<p role="alert">{error}</p>:null}
   {data?<MuseumLiveTreeDiagram key={data.retrievedAt} data={data} label={option.label}/>:null}
  </div>
 </details>;
}
export function MuseumLiveTreeDiagram({data,label}:{data:MuseumLiveTree;label:string}) {
 const {layout}=data,cfg=TREE_GEOMETRY;const prefix=useId().replaceAll(":","");const titleId=useId();
 const [zoom,setZoom]=useState<number|null>(null),[secondary,setSecondary]=useState(false),[selected,setSelected]=useState<string|null>(null);
 const person=layout.nodes.find(n=>n.id===selected),byId=new Map(layout.nodes.map(n=>[n.id,n]));
 const shortcuts=layout.edges.filter(e=>e.secondary==="shortcut").length;
 const isolated=layout.nodes.filter(n=>!layout.edges.some(e=>e.from===n.id||e.to===n.id)).length;
 const badge=(n:typeof layout.nodes[number])=>n.sourceOnly?"Identity not linked":presenceLabels[n.presence||"none"];
 const relationshipText=(edge:typeof layout.edges[number])=>`${byId.get(edge.from)?.name} ${edge.kind==="guru"?"→":"—"} ${byId.get(edge.to)?.name}: ${edge.kind==="guru"?"guru to disciple":edge.kind}${edge.secondary?` (${edge.secondary})`:""}. ${edge.claims.map(c=>`${c.status.replaceAll("_"," ")}, ${c.evidence}, ${c.confidence} confidence`).join("; ")}`;
 return <div className="museum-live-tree-panel admin-stack">
  <h3>{label}</h3><p>{layout.nodes.length} saints · Loaded {new Date(data.retrievedAt).toLocaleTimeString()}</p>
  {data.sourceReferenceClaims?<p>{data.sourceReferenceClaims} preserved export claims are shown as unreviewed reference evidence. Website decisions take precedence; this does not import or approve relationships.</p>:null}
  {data.unlinkedSourcePeople?<p>{data.unlinkedSourcePeople} source saints still need a website identity link. Their museum presence is unknown.</p>:null}
  {isolated&&layout.edges.length?<p>{isolated} saints have no connections recorded in this view; the graph is incomplete.</p>:null}
  {!layout.edges.length&&layout.nodes.length?<p>No connections matched this view. Try including relationships awaiting review, or review the saint’s relationship records.</p>:null}
  {data.truncated?<p role="status">Showing a bounded view of this network (up to {data.limits.nodes} saints / {data.limits.hops} connections deep). Some connections may be outside this view; inferred heads are local to the displayed graph.</p>:null}
  {layout.edges.some(e=>e.secondary==="cycle")?<p role="status">Some relationship directions form a cycle. Dashed conflict connections remain visible; review their evidence before relying on the generation order.</p>:null}
  <p className="museum-filter-note">Colored arrows: guru → disciple. Dashed pink: partners. Dotted green: incarnation. Dashed lineage arrows: uncertain or unreviewed. Node badges describe this museum’s evidence, not inventory completeness.</p>
  <div className="review-actions"><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setZoom(null)}>Fit</button><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setZoom(1)}>100%</button><button type="button" className="museum-admin-button museum-admin-button--secondary" aria-label="Zoom out" onClick={()=>setZoom(z=>Math.max(.25,(z??1)-.25))}>−</button><button type="button" className="museum-admin-button museum-admin-button--secondary" aria-label="Zoom in" onClick={()=>setZoom(z=>Math.min(2,(z??1)+.25))}>+</button>{shortcuts?<label title="Show direct guru links that also have an indirect path through other saints"><input type="checkbox" checked={secondary} onChange={e=>setSecondary(e.target.checked)}/> Show lineage shortcuts ({shortcuts})</label>:null}</div>
  {!layout.nodes.length?<p>No active linked saints were found.</p>:<div className="museum-live-tree-viewport" tabIndex={0} role="region" aria-label="Scrollable relationship diagram">
   <svg className="museum-live-tree" width={zoom===null?"100%":layout.width*zoom} height={zoom===null?undefined:layout.height*zoom} viewBox={`0 0 ${layout.width} ${layout.height}`} role="group" aria-label={`${label} live relationship diagram`}>
    <defs>{Array.from({length:6},(_,i)=><marker key={i} id={`${prefix}-arrow-${i}`} className={`museum-tree-lineage-${i}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 z"/></marker>)}</defs>
    {layout.edges.filter(e=>e.secondary!=="shortcut"||secondary).map(e=><path key={e.key} className={`museum-tree-edge museum-tree-edge--${e.kind} museum-tree-lineage-${e.lineage}${e.secondary||e.claims.some(c=>c.status!=="published"||!["certain","traditional"].includes(c.evidence))?" museum-tree-edge--uncertain":""}`} d={e.path} markerEnd={e.kind==="guru"?`url(#${prefix}-arrow-${e.lineage})`:undefined}><title>{relationshipText(e)}</title></path>)}
    {layout.nodes.map(n=><g key={n.id} transform={`translate(${n.x},${n.y})`} className={`museum-tree-node museum-tree-node--${n.presence||"none"}`} role="button" tabIndex={0} aria-label={`${n.name}: ${badge(n)}. Open saint details`} onClick={()=>setSelected(n.id)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setSelected(n.id);}}}>
     <title>{n.name}</title><rect width={cfg.nodeWidth} height={cfg.nodeHeight}/>
     {treeNameLines(n.name).map((line,i)=><text key={i} x="14" y={23+i*17} className="museum-tree-name">{line}</text>)}
     <text x="14" y="95" className="museum-tree-meta">{[n.role,[n.birthYear,n.samadhiYear].filter(y=>y!==null).join("–")].filter(Boolean).join(" · ")}</text>
     <text x="14" y="117" className="museum-tree-badge">{badge(n)}</text>
    </g>)}
   </svg>
  </div>}
  <details><summary>All connections and review evidence ({layout.edges.length})</summary><p>Shortcuts, partner-pair guru links and cycle conflicts remain here including shortcuts hidden from the diagram. “Cycle” flags a direction conflict requiring review.</p><ul>{layout.edges.map(e=><li key={e.key}>{relationshipText(e)}</li>)}</ul></details>
  <details><summary>Saints in this view</summary><ul>{layout.nodes.map(n=><li key={n.id}><button type="button" className="museum-saint-link" onClick={()=>setSelected(n.id)}>{n.name}</button> · {badge(n)}</li>)}</ul></details>
  {person?<MuseumDetailDialog titleId={titleId} kicker="Relationship context" closeLabel="Close relationship context" onClose={()=>setSelected(null)}>
   <MuseumSaintProfile titleId={titleId} profile={data.profiles[person.id]||{name:person.name,description:"",images:[],facts:[]}}/>
   <p>{badge(person)}. This describes the selected museum’s records; an absent record does not establish physical absence.</p>
   <h3>Relationships in this view</h3><ul>{layout.edges.filter(e=>e.from===person.id||e.to===person.id).map(e=><li key={e.key}>{relationshipText(e)}</li>)}</ul>
  </MuseumDetailDialog>:null}
 </div>;
}
