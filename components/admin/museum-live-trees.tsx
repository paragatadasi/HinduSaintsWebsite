"use client";
import {useEffect,useId,useMemo,useRef,useState} from "react";
import type {MuseumSection} from "@/lib/museum-proposals";
import type {MuseumLiveTree} from "@/lib/museum-live-tree";
import {TREE_GEOMETRY,treeNameLines,layoutMuseumTree,treeColumnsForWidth,connectedTreeGraph,treeNeighborhood,type TreePerson} from "@/lib/museum-tree-layout";
import {museumTreeOptions,type MuseumTreeOption} from "@/lib/museum-tree-options";
import {Triangle} from "lucide-react";
import {MuseumDetailDialog} from "./museum-detail-dialog";
import {MuseumSaintProfile} from "./museum-saint-profile";

const presenceLabels={location:"Recorded location",catalogue:"Collection record",source:"Source inventory",none:"Not recorded here"};
type TreeOption=MuseumTreeOption;
export function MuseumLiveTrees({section,museum}:{section:MuseumSection;museum:"spn"|"vrindavan"}) {
 const {main,additional}=museumTreeOptions(section);
 return <section className="museum-admin-panel">
  <div className="museum-admin-kicker">Family trees</div><h2>Relationship trees in this section</h2>
  <p>Open a family to explore its relationships. Reference connections remain labeled where website records are incomplete.</p>
  <div className="museum-tree-grid">{main.map(option=><MuseumLiveTreePanel key={option.key} option={option} museum={museum}/>)}</div>
  {additional.length?<details><summary>More families in this section ({additional.length})</summary><div className="museum-tree-grid">{additional.map(option=><MuseumLiveTreePanel key={option.key} option={option} museum={museum}/>)}</div></details>:null}
  {!main.length&&!additional.length?<p>No families with multiple section members are available yet.</p>:null}
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
   {data?(data.layout.edges.length?<MuseumLiveTreeDiagram key={data.retrievedAt} data={data} label={option.label}/>:<p>No relationships between different saints are recorded for this family in this view.</p>):null}
  </div>
 </details>;
}
// The map preserves the whole family shape; readable cards explain one neighborhood.
export function MuseumLiveTreeDiagram({data,label,highlightSaintId}:{data:MuseumLiveTree;label:string;highlightSaintId?:string}) {
 const graph=useMemo(()=>connectedTreeGraph(data.layout,highlightSaintId),[data.layout,highlightSaintId]);
 const map=useMemo(()=>layoutMuseumTree(graph.nodes,graph.edges.flatMap(e=>e.claims)),[graph]);
 const initial=highlightSaintId||map.nodes.find(n=>n.role==="Head (inferred)")?.id||map.nodes[0]?.id;
 const [focus,setFocus]=useState<string|undefined>(initial),[history,setHistory]=useState<string[]>([]),[personId,setPersonId]=useState<string|null>(null),[fullscreen,setFullscreen]=useState(false);
 const heading=useId(),dialogHeading=useId();
 const overview=useRef<HTMLDetailsElement>(null);
 const groups=treeNeighborhood(graph,focus),active=graph.nodes.find(n=>n.id===focus),person=graph.nodes.find(n=>n.id===personId);
 const shown=new Set([focus,...groups.flatMap(g=>g.people.map(n=>n.id))]);
 const evidence=(n:TreePerson)=>n.sourceOnly?"Identity not linked":presenceLabels[n.presence||"none"];
 const here=(n:TreePerson)=>!n.sourceOnly&&Boolean(n.presence&&n.presence!=="none");
 const choose=(id:string)=>{if(focus&&focus!==id)setHistory(h=>[...h,focus]);setFocus(id);};
 const card=(n:TreePerson,current=false)=><article key={n.id} className={`museum-tree-person${current?" museum-tree-person--current":""}${here(n)?" museum-tree-person--present":""}`}>
  {current?<strong>{n.name}</strong>:<button type="button" className="museum-saint-link" onClick={()=>choose(n.id)} aria-label={`Explore relationships of ${n.name}`}>{n.name}</button>}
  {n.birthYear!==null||n.samadhiYear!==null?<small>{[n.birthYear,n.samadhiYear].filter(y=>y!==null).join("–")}</small>:null}
  <button type="button" className="museum-saint-link museum-tree-person__details" onClick={()=>setPersonId(n.id)} aria-label={`Details for ${n.name}`}>Details</button>
 </article>;
 if(graph.nodes.length<2||!graph.edges.length)return null;
 return <div className="museum-live-tree-panel museum-tree-explorer admin-stack">
  <h3>{label}</h3>
  {map.edges.some(e=>e.secondary==="cycle")?<p role="status">Conflicting teacher–disciple directions are recorded in this family. Review the connection evidence before relying on the branch order.</p>:null}
  <details ref={overview} open className="museum-tree-overview"><summary>Whole family · {graph.nodes.length} saints</summary>
   <p className="museum-filter-note">Tap a card to explore, or choose a name below.</p>
   <svg className="museum-tree-map" viewBox={`0 0 ${map.width} ${map.height}`} role="group" aria-label={`${label} whole-family map`}>
    {map.edges.filter(e=>e.secondary!=="shortcut").map(e=><path key={e.key} d={e.path} className={`museum-tree-edge museum-tree-edge--${e.kind} museum-tree-lineage-${e.lineage}`}><title>{graph.nodes.find(n=>n.id===e.from)?.name} {e.kind==="guru"?"→":"—"} {graph.nodes.find(n=>n.id===e.to)?.name}</title></path>)}
    {map.nodes.map(n=><g key={n.id} transform={`translate(${n.x},${n.y})`} className={`museum-tree-map-node${here(n)?" museum-tree-map-node--present":""}${shown.has(n.id)?" museum-tree-map-node--visible":""}${focus===n.id?" museum-tree-map-node--focus":""}${highlightSaintId===n.id?" museum-tree-map-node--selected":""}`} role="button" tabIndex={0} aria-label={`Explore relationships of ${n.name}`} aria-pressed={focus===n.id} onClick={()=>choose(n.id)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();choose(n.id);}}}>
     <title>{n.name} · {evidence(n)}</title><rect width={TREE_GEOMETRY.nodeWidth} height={TREE_GEOMETRY.nodeHeight}/>
    </g>)}
   </svg>
   <details><summary>Map key</summary><p>Gold fill marks your focus. Bright outlines mark the saints shown below; a gold outline marks the saint whose overview you opened. Other filled cards have a museum record; hollow cards have unknown or unrecorded presence. A record does not confirm a current shelf.</p></details>
  </details>
  <div className="review-actions"><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>{setFocus(undefined);setHistory([]);if(overview.current){overview.current.open=true;overview.current.scrollIntoView({block:"nearest"});}}}>Whole family</button>{history.length?<button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>{setFocus(history.at(-1));setHistory(h=>h.slice(0,-1));}}>Back to previous saint</button>:null}{highlightSaintId&&focus!==highlightSaintId?<button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>choose(highlightSaintId)}>Return to selected saint</button>:null}<button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setFullscreen(true)}>Full screen</button></div>
  <label className="museum-tree-picker admin-field">Explore a saint<select value={focus||""} onChange={e=>e.target.value?choose(e.target.value):setFocus(undefined)}><option value="">Choose a saint</option>{[...graph.nodes].sort((a,b)=>a.name.localeCompare(b.name)).map(n=><option key={n.id} value={n.id}>{n.name}</option>)}</select></label>
  <section className="museum-tree-neighborhood" aria-labelledby={heading}>
   <h4 id={heading} aria-live="polite">{active?`Relationships of ${active.name}`:"Choose a saint in the map or list to read their relationships."}</h4>
   {groups.filter(g=>g.key==="teachers").map(g=><section key={g.key}><h5>{g.label} ({g.people.length})</h5><div className="museum-tree-people">{g.people.map(n=>card(n))}</div><p className="museum-tree-direction" aria-hidden="true">↓</p></section>)}
   {active?card(active,true):null}
   {groups.filter(g=>g.key!=="teachers").map(g=><section key={g.key}>{g.key==="disciples"?<p className="museum-tree-direction" aria-hidden="true">↓</p>:null}<h5>{g.label} ({g.people.length})</h5><div className="museum-tree-people">{g.people.map(n=>card(n))}</div></section>)}
  </section>
  <details><summary>Connections and museum evidence</summary>
   <p>Solid lines show connections, not review approval. Colors distinguish lineages, partners (pink), and incarnation (green). The map is a relationship arrangement, not a date scale.</p>
   <p>Source inventory means an imported museum inventory mentions the saint. It does not confirm physical presence or a current vitrine. Saints without an identity link remain unknown.</p>
   {data.sourceReferenceClaims?<p>{data.sourceReferenceClaims} preserved export claims are included as unreviewed reference evidence; website decisions take precedence.</p>:null}
   <ul>{graph.edges.map(e=><li key={e.key}>{graph.nodes.find(n=>n.id===e.from)?.name} {e.kind==="guru"?"→":"—"} {graph.nodes.find(n=>n.id===e.to)?.name} · {e.kind}{e.secondary?` (${e.secondary})`:""}<ul>{e.claims.map(c=><li key={c.id}>{c.status.replaceAll("_"," ")} · {c.evidence} · {c.confidence} confidence</li>)}</ul></li>)}</ul>
  </details>
  {data.truncated?<p role="status">This is a partial family map, limited to {data.limits.nodes} saints and {data.limits.hops} connections deep.</p>:null}
  {fullscreen?<MuseumDetailDialog titleId={dialogHeading} kicker="Whole family" closeLabel="Exit full screen" fullScreen onClose={()=>setFullscreen(false)}><MuseumTreeCanvas data={data} label={label} immersive headingId={dialogHeading} highlightSaintId={focus||highlightSaintId}/></MuseumDetailDialog>:null}
  {person?<MuseumDetailDialog titleId={dialogHeading} kicker="Relationship context" closeLabel="Close relationship context" onClose={()=>setPersonId(null)}><MuseumSaintProfile titleId={dialogHeading} profile={data.profiles[person.id]||{name:person.name,description:"",images:[],facts:[]}}/><p>{evidence(person)}. An inventory or collection record does not confirm current physical location.</p></MuseumDetailDialog>:null}
 </div>;
}
function MuseumTreeCanvas({data,label,immersive=false,initialZoom=null,initialCompact=false,headingId,highlightSaintId}:{data:MuseumLiveTree;label:string;immersive?:boolean;initialZoom?:number|null;initialCompact?:boolean;headingId?:string;highlightSaintId?:string}) {
 const cfg=TREE_GEOMETRY;const prefix=useId().replaceAll(":","");const titleId=useId(),diagramTitleId=useId();
 const [zoom,setZoom]=useState<number|null>(initialZoom),[secondary,setSecondary]=useState(false),[selected,setSelected]=useState<string|null>(null),[fullscreen,setFullscreen]=useState(false),[compact]=useState(initialCompact);
 const viewport=useRef<HTMLDivElement>(null),[viewportWidth,setViewportWidth]=useState(0);
 const columns=viewportWidth?treeColumnsForWidth(viewportWidth):3;
 const layout=useMemo(()=>{const graph=connectedTreeGraph(data.layout,highlightSaintId);return layoutMuseumTree(graph.nodes,graph.edges.flatMap(e=>e.claims),{compact,columns});},[data.layout,compact,columns,highlightSaintId]);
 useEffect(()=>{const node=viewport.current;if(!node)return;const observer=new ResizeObserver(()=>setViewportWidth(node.clientWidth));observer.observe(node);return()=>observer.disconnect();},[layout.nodes.length]);
 const effectiveZoom=immersive?(zoom??(viewportWidth?Math.min(1,viewportWidth/layout.width):1)):(viewportWidth?Math.min(1,viewportWidth/layout.width):1);
 function changeZoom(delta:number){setZoom(Math.max(.25,Math.min(2,effectiveZoom+delta)));}

 const person=layout.nodes.find(n=>n.id===selected),byId=new Map(layout.nodes.map(n=>[n.id,n]));
 const shortcuts=layout.edges.filter(e=>e.secondary==="shortcut").length;
 const isolated=layout.nodes.filter(n=>!layout.edges.some(e=>e.from===n.id||e.to===n.id)).length;
 const badge=(n:typeof layout.nodes[number])=>n.sourceOnly?"Identity not linked":presenceLabels[n.presence||"none"];
 const relationshipText=(edge:typeof layout.edges[number])=>`${byId.get(edge.from)?.name} ${edge.kind==="guru"?"→":"—"} ${byId.get(edge.to)?.name}: ${edge.kind==="guru"?"guru to disciple":edge.kind}${edge.secondary?` (${edge.secondary})`:""}. ${edge.claims.map(c=>`${c.status.replaceAll("_"," ")}, ${c.evidence}, ${c.confidence} confidence`).join("; ")}`;
 if(layout.nodes.length<2||!layout.edges.length)return null;
 return <div className="museum-live-tree-panel admin-stack">
  <h3 id={headingId||diagramTitleId}>{label}</h3>{highlightSaintId?<p className="museum-filter-note">The highlighted card is the selected saint.</p>:null}<p>{layout.nodes.length} saints{immersive?null:<> · Loaded {new Date(data.retrievedAt).toLocaleTimeString()}</>}</p>
  {data.sourceReferenceClaims?<details><summary>Includes unreviewed export references</summary><p>{data.sourceReferenceClaims} preserved export claims are shown as unreviewed reference evidence. Website decisions take precedence; this does not import or approve relationships.</p></details>:null}
  {data.unlinkedSourcePeople?<p>{data.unlinkedSourcePeople} source saints still need a website identity link. Their museum presence is unknown.</p>:null}
  {isolated&&layout.edges.length?<p>{isolated} saints have no connections recorded in this view; the graph is incomplete.</p>:null}
  {!layout.edges.length&&layout.nodes.length?<p>No connections matched this view. Try including relationships awaiting review, or review the saint’s relationship records.</p>:null}
  {data.truncated?<p role="status">Showing a bounded view of this network (up to {data.limits.nodes} saints / {data.limits.hops} connections deep). Some connections may be outside this view; inferred heads are local to the displayed graph.</p>:null}
  {layout.edges.some(e=>e.secondary==="cycle")?<p role="status">Some relationship directions form a cycle. Conflict connections remain visible; review their evidence before relying on the generation order.</p>:null}
  <details><summary>How to read this tree</summary><p className="museum-filter-note">Solid arrows: guru → disciple. Pink connections: partners. Green connections: incarnation. Line style does not indicate approval; review status is available in connection details.</p><p>Peers remain in generation rows, with partners together. This is not a timeline. Select a saint for details.</p></details>
  <div className="review-actions museum-tree-toolbar">{immersive?<><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setZoom(null)}>Fit overview</button><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setZoom(1)}>Readable size</button><button type="button" className="museum-admin-button museum-admin-button--secondary" aria-label="Zoom out" onClick={()=>changeZoom(-.25)}>−</button><button type="button" className="museum-admin-button museum-admin-button--secondary" aria-label="Zoom in" onClick={()=>changeZoom(.25)}>+</button><span aria-live="polite">{Math.round(effectiveZoom*100)}%</span></>:null}{!immersive?<button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setFullscreen(true)}>Full screen</button>:null}{shortcuts?<label title="Show direct guru links that also have an indirect path through other saints"><input type="checkbox" checked={secondary} onChange={e=>setSecondary(e.target.checked)}/> Show lineage shortcuts ({shortcuts})</label>:null}</div>
  {!layout.nodes.length?<p>No active linked saints were found.</p>:<div ref={viewport} className={`museum-live-tree-viewport${immersive?"":" museum-live-tree-viewport--inline"}`} tabIndex={0} role="region" aria-label="Relationship diagram">
   <svg className="museum-live-tree" width={layout.width*effectiveZoom} height={layout.height*effectiveZoom} viewBox={`0 0 ${layout.width} ${layout.height}`} role="group" aria-label={`${label} live relationship diagram`}>
    <defs>{Array.from({length:6},(_,i)=><marker key={i} id={`${prefix}-arrow-${i}`} className={`museum-tree-lineage-${i}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 z"/></marker>)}</defs>
    {layout.edges.filter(e=>e.secondary!=="shortcut"||secondary).map(e=><path key={e.key} className={`museum-tree-edge museum-tree-edge--${e.kind} museum-tree-lineage-${e.lineage}${e.secondary||e.claims.some(c=>c.status!=="published"||!["certain","traditional"].includes(c.evidence))?" museum-tree-edge--uncertain":""}`} d={e.path} markerEnd={e.kind==="guru"?`url(#${prefix}-arrow-${e.lineage})`:undefined}><title>{relationshipText(e)}</title></path>)}
    {layout.nodes.map(n=><g key={n.id} transform={`translate(${n.x},${n.y})`} className={`museum-tree-node museum-tree-node--${n.presence||"none"}${n.id===highlightSaintId?" museum-tree-node--selected":""}`} role="button" aria-current={n.id===highlightSaintId?"true":undefined} tabIndex={0} aria-label={`${n.name}: ${badge(n)}. Open saint details`} onClick={()=>setSelected(n.id)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setSelected(n.id);}}}>
     <title>{n.name}{n.id===highlightSaintId?" — Selected saint":""}</title><rect width={cfg.nodeWidth} height={cfg.nodeHeight}/>
     {treeNameLines(n.name).map((line,i)=><text key={i} x={cfg.nameX} y={cfg.nameY+i*cfg.nameLineHeight} className="museum-tree-name">{line}</text>)}
     <text x={cfg.nameX} y={cfg.metaY} className="museum-tree-meta">{[n.birthYear,n.samadhiYear].filter(y=>y!==null).join("–")}</text>

    </g>)}
   </svg>
  </div>}
  <details><summary>All connections and review evidence ({layout.edges.length})</summary><p>Shortcuts, partner-pair guru links and cycle conflicts remain here including shortcuts hidden from the diagram. “Cycle” flags a direction conflict requiring review.</p><ul>{layout.edges.map(e=><li key={e.key}>{relationshipText(e)}</li>)}</ul></details>
  <details><summary>Saints in this view</summary><ul>{layout.nodes.map(n=><li key={n.id}><button type="button" className="museum-saint-link" onClick={()=>setSelected(n.id)}>{n.name}</button> · {badge(n)}</li>)}</ul></details>
  {fullscreen?<MuseumDetailDialog titleId={diagramTitleId+"-fullscreen"} kicker="Relationship tree" closeLabel="Exit full screen" fullScreen onClose={()=>setFullscreen(false)}><MuseumTreeCanvas headingId={diagramTitleId+"-fullscreen"} data={data} label={label} immersive highlightSaintId={highlightSaintId} initialZoom={zoom} initialCompact={compact}/></MuseumDetailDialog>:null}
  {person?<MuseumDetailDialog titleId={titleId} kicker="Relationship context" closeLabel="Close relationship context" onClose={()=>setSelected(null)}>
   <MuseumSaintProfile titleId={titleId} profile={data.profiles[person.id]||{name:person.name,description:"",images:[],facts:[]}}/>
   <p>{badge(person)}. This describes the selected museum’s records; an absent record does not establish physical absence.</p>
   <h3>Relationships in this view</h3><ul>{layout.edges.filter(e=>e.from===person.id||e.to===person.id).map(e=><li key={e.key}>{relationshipText(e)}</li>)}</ul>
  </MuseumDetailDialog>:null}
 </div>;
}

export function MuseumSaintTree({saintId,sourceId,familyKey,museum,name}:{saintId?:string;sourceId?:string;familyKey?:string;museum:"spn"|"vrindavan";name:string}) {
 const [data,setData]=useState<MuseumLiveTree|null>(null),[error,setError]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{if(!saintId&&!familyKey)return;const controller=new AbortController();setData(null);setError(false);
 fetch("/api/admin/museum/relationship-tree",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({museum,seeds:saintId?[saintId]:[],familyKey:familyKey||undefined,includeSource:Boolean(familyKey),includeUnreviewed:true}),signal:controller.signal}).then(async response=>{if(!response.ok)throw Error();return response.json();}).then(result=>{if(!controller.signal.aborted)setData(result);}).catch(()=>{if(!controller.signal.aborted)setError(true);});return()=>controller.abort();
 },[saintId,familyKey,museum,retry]);
 if(error)return <p>Relationships could not be loaded. <button type="button" className="museum-saint-link" onClick={()=>setRetry(n=>n+1)}>Retry</button></p>;
 if(!data?.layout.edges.length)return null;
 return <section className="museum-saint-review-section"><MuseumLiveTreeDiagram data={data} label={`Relationships · ${name}`} highlightSaintId={saintId||(sourceId?"source:"+sourceId:undefined)}/></section>;
}
