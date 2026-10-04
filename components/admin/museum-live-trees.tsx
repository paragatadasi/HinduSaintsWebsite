"use client";
import {useEffect,useId,useMemo,useRef,useState} from "react";
import type {MuseumSection} from "@/lib/museum-proposals";
import type {MuseumLiveTree} from "@/lib/museum-live-tree";
import {TREE_GEOMETRY,treeNameLines,layoutMuseumTree} from "@/lib/museum-tree-layout";
import {museumTreeOptions,type MuseumTreeOption} from "@/lib/museum-tree-options";
import {Triangle} from "lucide-react";
import {MuseumDetailDialog} from "./museum-detail-dialog";
import {MuseumSaintProfile} from "./museum-saint-profile";

const presenceLabels={location:"Recorded location",catalogue:"Collection record",source:"Source inventory",none:"Not recorded here"};
type TreeOption=MuseumTreeOption;
export function MuseumLiveTrees({section,museum}:{section:MuseumSection;museum:"spn"|"vrindavan"}) {
 const {main,additional}=museumTreeOptions(section);
 return <section className="museum-admin-panel">
  <div className="museum-admin-kicker">Live relationship trees · Preview</div><h2>Compare with the original diagrams</h2>
  <p>Open any family to generate its tree. Keep multiple trees open for comparison. Preserved export connections are labeled reference evidence where website relationships are missing; no records are changed.</p>
  <div className="museum-tree-grid">{main.map(option=><MuseumLiveTreePanel key={option.key} option={option} museum={museum}/>)}</div>
  {additional.length?<details><summary>More families and individual saints in this section ({additional.length})</summary><div className="museum-tree-grid">{additional.map(option=><MuseumLiveTreePanel key={option.key} option={option} museum={museum}/>)}</div></details>:null}
  {!main.length&&!additional.length?<p>No families or linked saints are available in this section yet.</p>:null}
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
export function MuseumLiveTreeDiagram({data,label,immersive=false,initialZoom=1,initialCompact=true,headingId}:{data:MuseumLiveTree;label:string;immersive?:boolean;initialZoom?:number|null;initialCompact?:boolean;headingId?:string}) {
 const cfg=TREE_GEOMETRY;const prefix=useId().replaceAll(":","");const titleId=useId(),diagramTitleId=useId();
 const [zoom,setZoom]=useState<number|null>(initialZoom),[secondary,setSecondary]=useState(false),[selected,setSelected]=useState<string|null>(null),[fullscreen,setFullscreen]=useState(false),[compact,setCompact]=useState(initialCompact);
 const layout=useMemo(()=>compact?layoutMuseumTree(data.layout.nodes,data.layout.edges.flatMap(e=>e.claims),{compact:true}):data.layout,[data.layout,compact]);
 const viewport=useRef<HTMLDivElement>(null),[viewportWidth,setViewportWidth]=useState(0);
 useEffect(()=>{const node=viewport.current;if(!node)return;const observer=new ResizeObserver(()=>setViewportWidth(node.clientWidth));observer.observe(node);return()=>observer.disconnect();},[layout.nodes.length]);
 useEffect(()=>{const node=viewport.current;if(!node)return;node.scrollLeft=zoom===null?0:Math.max(0,Math.min(...layout.nodes.map(n=>n.x))*zoom-Math.min(cfg.margin/2,Math.max(0,(node.clientWidth-cfg.nodeWidth*zoom)/2)));},[layout,zoom,viewportWidth,cfg.margin,cfg.nodeWidth]);
 const effectiveZoom=zoom??(viewportWidth?viewportWidth/layout.width:1);
 function changeZoom(delta:number){setZoom(Math.max(.25,Math.min(2,effectiveZoom+delta)));}

 const person=layout.nodes.find(n=>n.id===selected),byId=new Map(layout.nodes.map(n=>[n.id,n]));
 const shortcuts=layout.edges.filter(e=>e.secondary==="shortcut").length;
 const isolated=layout.nodes.filter(n=>!layout.edges.some(e=>e.from===n.id||e.to===n.id)).length;
 const badge=(n:typeof layout.nodes[number])=>n.sourceOnly?"Identity not linked":presenceLabels[n.presence||"none"];
 const relationshipText=(edge:typeof layout.edges[number])=>`${byId.get(edge.from)?.name} ${edge.kind==="guru"?"→":"—"} ${byId.get(edge.to)?.name}: ${edge.kind==="guru"?"guru to disciple":edge.kind}${edge.secondary?` (${edge.secondary})`:""}. ${edge.claims.map(c=>`${c.status.replaceAll("_"," ")}, ${c.evidence}, ${c.confidence} confidence`).join("; ")}`;
 return <div className="museum-live-tree-panel admin-stack">
  <h3 id={headingId||diagramTitleId}>{label}</h3><p>{layout.nodes.length} saints{immersive?null:<> · Loaded {new Date(data.retrievedAt).toLocaleTimeString()}</>}</p>
  {data.sourceReferenceClaims?<details><summary>Includes unreviewed export references</summary><p>{data.sourceReferenceClaims} preserved export claims are shown as unreviewed reference evidence. Website decisions take precedence; this does not import or approve relationships.</p></details>:null}
  {data.unlinkedSourcePeople?<p>{data.unlinkedSourcePeople} source saints still need a website identity link. Their museum presence is unknown.</p>:null}
  {isolated&&layout.edges.length?<p>{isolated} saints have no connections recorded in this view; the graph is incomplete.</p>:null}
  {!layout.edges.length&&layout.nodes.length?<p>No connections matched this view. Try including relationships awaiting review, or review the saint’s relationship records.</p>:null}
  {data.truncated?<p role="status">Showing a bounded view of this network (up to {data.limits.nodes} saints / {data.limits.hops} connections deep). Some connections may be outside this view; inferred heads are local to the displayed graph.</p>:null}
  {layout.edges.some(e=>e.secondary==="cycle")?<p role="status">Some relationship directions form a cycle. Dashed conflict connections remain visible; review their evidence before relying on the generation order.</p>:null}
  <details><summary>How to read this tree</summary><p className="museum-filter-note">Colored arrows: guru → disciple. Dashed pink: partners. Dotted green: incarnation. Dashed lineage arrows: uncertain or unreviewed. Node badges describe this museum’s evidence, not inventory completeness.</p><p>Compact rows wrap peers in birth-date order where known, keeping partners together and disciples below their teachers. This is not a timeline. Scroll within the tree to explore; select a saint for details.</p></details>
  <div className="review-actions museum-tree-toolbar"><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setZoom(null)}>Fit overview</button><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setZoom(1)}>Readable size</button><button type="button" className="museum-admin-button museum-admin-button--secondary" aria-label="Zoom out" onClick={()=>changeZoom(-.25)}>−</button><button type="button" className="museum-admin-button museum-admin-button--secondary" aria-label="Zoom in" onClick={()=>changeZoom(.25)}>+</button><span aria-live="polite">{Math.round(effectiveZoom*100)}%</span><label><input type="checkbox" checked={compact} onChange={e=>setCompact(e.target.checked)}/> Compact rows</label>{!immersive?<button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setFullscreen(true)}>Full screen</button>:null}{shortcuts?<label title="Show direct guru links that also have an indirect path through other saints"><input type="checkbox" checked={secondary} onChange={e=>setSecondary(e.target.checked)}/> Show lineage shortcuts ({shortcuts})</label>:null}</div>
  {!layout.nodes.length?<p>No active linked saints were found.</p>:<div ref={viewport} className="museum-live-tree-viewport" tabIndex={0} role="region" aria-label="Scrollable relationship diagram">
   <svg className="museum-live-tree" width={zoom===null?"100%":layout.width*zoom} height={zoom===null?undefined:layout.height*zoom} viewBox={`0 0 ${layout.width} ${layout.height}`} role="group" aria-label={`${label} live relationship diagram`}>
    <defs>{Array.from({length:6},(_,i)=><marker key={i} id={`${prefix}-arrow-${i}`} className={`museum-tree-lineage-${i}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 z"/></marker>)}</defs>
    {layout.edges.filter(e=>e.secondary!=="shortcut"||secondary).map(e=><path key={e.key} className={`museum-tree-edge museum-tree-edge--${e.kind} museum-tree-lineage-${e.lineage}${e.secondary||e.claims.some(c=>c.status!=="published"||!["certain","traditional"].includes(c.evidence))?" museum-tree-edge--uncertain":""}`} d={e.path} markerEnd={e.kind==="guru"?`url(#${prefix}-arrow-${e.lineage})`:undefined}><title>{relationshipText(e)}</title></path>)}
    {layout.nodes.map(n=><g key={n.id} transform={`translate(${n.x},${n.y})`} className={`museum-tree-node museum-tree-node--${n.presence||"none"}`} role="button" tabIndex={0} aria-label={`${n.name}: ${badge(n)}. Open saint details`} onClick={()=>setSelected(n.id)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setSelected(n.id);}}}>
     <title>{n.name}</title><rect width={cfg.nodeWidth} height={cfg.nodeHeight}/>
     {treeNameLines(n.name).map((line,i)=><text key={i} x={cfg.nameX} y={cfg.nameY+i*cfg.nameLineHeight} className="museum-tree-name">{line}</text>)}
     <text x={cfg.nameX} y={cfg.metaY} className="museum-tree-meta">{[n.role,[n.birthYear,n.samadhiYear].filter(y=>y!==null).join("–")].filter(Boolean).join(" · ")}</text>
     <text x={cfg.nameX} y={cfg.badgeY} className="museum-tree-badge">{badge(n)}</text>
    </g>)}
   </svg>
  </div>}
  <details><summary>All connections and review evidence ({layout.edges.length})</summary><p>Shortcuts, partner-pair guru links and cycle conflicts remain here including shortcuts hidden from the diagram. “Cycle” flags a direction conflict requiring review.</p><ul>{layout.edges.map(e=><li key={e.key}>{relationshipText(e)}</li>)}</ul></details>
  <details><summary>Saints in this view</summary><ul>{layout.nodes.map(n=><li key={n.id}><button type="button" className="museum-saint-link" onClick={()=>setSelected(n.id)}>{n.name}</button> · {badge(n)}</li>)}</ul></details>
  {fullscreen?<MuseumDetailDialog titleId={diagramTitleId+"-fullscreen"} kicker="Relationship tree" closeLabel="Exit full screen" fullScreen onClose={()=>setFullscreen(false)}><MuseumLiveTreeDiagram headingId={diagramTitleId+"-fullscreen"} data={data} label={label} immersive initialZoom={zoom} initialCompact={compact}/></MuseumDetailDialog>:null}
  {person?<MuseumDetailDialog titleId={titleId} kicker="Relationship context" closeLabel="Close relationship context" onClose={()=>setSelected(null)}>
   <MuseumSaintProfile titleId={titleId} profile={data.profiles[person.id]||{name:person.name,description:"",images:[],facts:[]}}/>
   <p>{badge(person)}. This describes the selected museum’s records; an absent record does not establish physical absence.</p>
   <h3>Relationships in this view</h3><ul>{layout.edges.filter(e=>e.from===person.id||e.to===person.id).map(e=><li key={e.key}>{relationshipText(e)}</li>)}</ul>
  </MuseumDetailDialog>:null}
 </div>;
}
