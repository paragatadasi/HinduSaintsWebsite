"use client";
import {useEffect,useLayoutEffect,useId,useMemo,useRef,useState} from "react";
import type {MuseumSection} from "@/lib/museum-proposals";
import type {MuseumLiveTree} from "@/lib/museum-live-tree";
import {TREE_GEOMETRY,TREE_MOBILE_GEOMETRY,treeNameLines,layoutMuseumTree,treeColumnsForWidth,connectedTreeGraph} from "@/lib/museum-tree-layout";
import {museumTreeOptions,type MuseumTreeOption} from "@/lib/museum-tree-options";
import {useMuseumTreeTouch} from "./use-museum-tree-touch";
import {clampTreeZoom,treeZoomScroll} from "@/lib/museum-tree-camera";
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
   <details className="museum-tree-settings"><summary>Tree options and sources</summary><div className="review-actions">
    <button className="museum-admin-button museum-admin-button--secondary" disabled={loading} type="button" onClick={()=>void load()}>Refresh tree</button>
    <label><input type="checkbox" checked={unreviewed} onChange={e=>{setUnreviewed(e.target.checked);void load(e.target.checked,source);}}/> Include website relationships awaiting review</label>
    {option.familyKey?<label><input type="checkbox" checked={source} onChange={e=>{setSource(e.target.checked);void load(unreviewed,e.target.checked);}}/> Show preserved export relationships</label>:null}
   </div></details>
   {option.seeds.length>60?<p>Starting from the first 60 linked members; the graph may be a partial family view.</p>:null}
   {loading?<p role="status">Generating tree…</p>:null}{error?<p role="alert">{error}</p>:null}
   {data?(data.layout.edges.length?<MuseumLiveTreeDiagram key={data.retrievedAt} data={data} label={option.label}/>:<p>No relationships between different saints are recorded for this family in this view.</p>):null}
  </div>
 </details>;
}
// Labels stay on the main diagram; the corner map supplies whole-family context.
export function MuseumLiveTreeDiagram({data,label,highlightSaintId}:{data:MuseumLiveTree;label:string;highlightSaintId?:string}) {
 return <MuseumTreeCanvas data={data} label={label} highlightSaintId={highlightSaintId}/>;
}
function MuseumTreeCanvas({data,label,immersive=false,initialZoom=1,initialCompact=false,headingId,highlightSaintId,initialFocus,onFocusChange}:{data:MuseumLiveTree;label:string;immersive?:boolean;initialZoom?:number|null;initialCompact?:boolean;headingId?:string;highlightSaintId?:string;initialFocus?:string;onFocusChange?:(id:string|undefined)=>void}) {
 const prefix=useId().replaceAll(":","");const titleId=useId(),diagramTitleId=useId();
 const [zoom,setZoom]=useState<number|null>(initialZoom),[secondary,setSecondary]=useState(false),[selected,setSelected]=useState<string|null>(null),[fullscreen,setFullscreen]=useState(false),[compact]=useState(initialCompact);
 const viewport=useRef<HTMLDivElement>(null),[viewportWidth,setViewportWidth]=useState(0);
 const [mobile,setMobile]=useState(false);
 const cfg=mobile?TREE_MOBILE_GEOMETRY:TREE_GEOMETRY;
 useEffect(()=>{const media=window.matchMedia("(max-width: 640px)");const update=()=>setMobile(media.matches);update();media.addEventListener("change",update);return()=>media.removeEventListener("change",update);},[]);
 const [focus,setFocusState]=useState<string|undefined>(initialFocus||highlightSaintId||data.layout.nodes[0]?.id);
 const [visible,setVisible]=useState({x:0,y:0,width:0,height:0});
 const [sheet,setSheet]=useState(false);
 const setFocus=(id:string|undefined)=>{setFocusState(id);onFocusChange?.(id);};
 const columns=viewportWidth?treeColumnsForWidth(viewportWidth):3;
 const layout=useMemo(()=>{const graph=connectedTreeGraph(data.layout,highlightSaintId);return layoutMuseumTree(graph.nodes,graph.edges.flatMap(e=>e.claims),{compact,columns,mobile});},[data.layout,compact,columns,highlightSaintId,mobile]);
 useEffect(()=>{const node=viewport.current;if(!node)return;const observer=new ResizeObserver(()=>setViewportWidth(node.clientWidth));observer.observe(node);return()=>observer.disconnect();},[layout.nodes.length]);
 const effectiveZoom=zoom??(viewportWidth?Math.min(1,viewportWidth/layout.width):1);
 const recenter=()=>{const node=layout.nodes.find(n=>n.id===focus),view=viewport.current;if(node&&view)view.scrollTo({left:Math.max(0,(node.x+cfg.nodeWidth/2)*effectiveZoom-view.clientWidth/2),top:Math.max(0,(node.y+cfg.nodeHeight/2)*effectiveZoom-view.clientHeight*.6)});};
 // Selection moves the camera; zoom gestures retain their own finger anchor.
 useEffect(()=>{recenter();},[focus,layout,immersive]);
 useEffect(()=>{const view=viewport.current;if(!view)return;const update=()=>setVisible({x:view.scrollLeft/effectiveZoom,y:view.scrollTop/effectiveZoom,width:Math.min(layout.width,view.clientWidth/effectiveZoom),height:Math.min(layout.height,view.clientHeight/effectiveZoom)});update();view.addEventListener("scroll",update,{passive:true});const observer=new ResizeObserver(update);observer.observe(view);return()=>{view.removeEventListener("scroll",update);observer.disconnect();};},[effectiveZoom,layout.width,layout.height]);
 const zoomAnchor=useRef<{x:number;y:number}|null>(null);
 useLayoutEffect(()=>{if(zoomAnchor.current&&viewport.current){viewport.current.scrollTo(zoomAnchor.current.x,zoomAnchor.current.y);zoomAnchor.current=null;}},[effectiveZoom]);
 const touch=useMuseumTreeTouch(viewport,effectiveZoom,setZoom,mobile&&immersive);
 const focused=layout.nodes.find(n=>n.id===focus);

 function changeZoom(delta:number){const next=clampTreeZoom(effectiveZoom+delta),view=viewport.current;if(view)zoomAnchor.current=treeZoomScroll({x:view.scrollLeft,y:view.scrollTop},{x:view.clientWidth/2,y:view.clientHeight/2},effectiveZoom,next);setZoom(next);}
 function readableFocus(){const view=viewport.current,node=layout.nodes.find(n=>n.id===focus);if(view&&node)zoomAnchor.current={x:Math.max(0,node.x+cfg.nodeWidth/2-view.clientWidth/2),y:Math.max(0,node.y+cfg.nodeHeight/2-view.clientHeight*.6)};if(effectiveZoom===1)recenter();else setZoom(1);}

 const person=layout.nodes.find(n=>n.id===selected),byId=new Map(layout.nodes.map(n=>[n.id,n]));
 const shortcuts=layout.edges.filter(e=>e.secondary==="shortcut").length;
 const isolated=layout.nodes.filter(n=>!layout.edges.some(e=>e.from===n.id||e.to===n.id)).length;
 const badge=(n:typeof layout.nodes[number])=>n.sourceOnly?"Identity not linked":presenceLabels[n.presence||"none"];
 const relationshipText=(edge:typeof layout.edges[number])=>`${byId.get(edge.from)?.name} ${["guru","successor"].includes(edge.kind)?"→":"—"} ${byId.get(edge.to)?.name}: ${edge.kind==="guru"?"guru to disciple":edge.kind==="successor"?"succession (predecessor to successor)":edge.kind}${edge.secondary?` (${edge.secondary})`:""}. ${edge.claims.map(c=>`${c.status.replaceAll("_"," ")}, ${c.evidence}, ${c.confidence} confidence`).join("; ")}`;
 if(layout.nodes.length<2||!layout.edges.length)return null;
 return <div className={`museum-live-tree-panel admin-stack${immersive?" museum-tree-explorer--active":" museum-tree-explorer--preview"}`}>
  <h3 id={headingId||diagramTitleId}>{label}</h3>{highlightSaintId?<p className="museum-filter-note">The highlighted card is the selected saint.</p>:null}<p className="museum-tree-count">{layout.nodes.length} saints{immersive?null:<> · Loaded {new Date(data.retrievedAt).toLocaleTimeString()}</>}</p>
  {data.sourceReferenceClaims?<details className="museum-tree-evidence"><summary>Includes unreviewed export references</summary><p>{data.sourceReferenceClaims} preserved export claims are shown as unreviewed reference evidence. Website decisions take precedence; this does not import or approve relationships.</p></details>:null}
  {data.unlinkedSourcePeople?<p className="museum-tree-source-note">{data.unlinkedSourcePeople} source saints still need a website identity link. Their museum presence is unknown.</p>:null}
  {isolated&&layout.edges.length?<p>{isolated} saints have no connections recorded in this view; the graph is incomplete.</p>:null}
  {!layout.edges.length&&layout.nodes.length?<p>No connections matched this view. Try including relationships awaiting review, or review the saint’s relationship records.</p>:null}
  {data.truncated?<p role="status">Showing a bounded view of this network (up to {data.limits.nodes} saints / {data.limits.hops} connections deep). Some connections may be outside this view; inferred heads are local to the displayed graph.</p>:null}
  {layout.edges.some(e=>e.secondary==="cycle")?<p role="status">Some relationship directions form a cycle. Conflict connections remain visible; review their evidence before relying on the generation order.</p>:null}
  <details className="museum-tree-evidence"><summary>How to read this tree</summary><p className="museum-filter-note">Filled arrows: guru → disciple. Open arrows: predecessor → successor. Pink connections: partners. Green connections: incarnation. Line style does not indicate approval; review status is available in connection details.</p><p>Peers remain in generation rows, with partners together. This is not a timeline. Select a saint to highlight it in both views, then open Saint details.</p></details>
  <div className="review-actions museum-tree-toolbar"><><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setZoom(null)}>Fit overview</button><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setZoom(1)}>Readable size</button><button type="button" className="museum-admin-button museum-admin-button--secondary" aria-label="Zoom out" onClick={()=>changeZoom(-.25)}>−</button><button type="button" className="museum-admin-button museum-admin-button--secondary" aria-label="Zoom in" onClick={()=>changeZoom(.25)}>+</button><span aria-live="polite">{Math.round(effectiveZoom*100)}%</span></>{!immersive?<button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setFullscreen(true)}>{mobile?"Explore tree":"Full screen"}</button>:null}{shortcuts?<label title="Show direct lineage links that also have an indirect path through other saints"><input type="checkbox" checked={secondary} onChange={e=>setSecondary(e.target.checked)}/> Show lineage shortcuts ({shortcuts})</label>:null}</div>
  <div className="museum-tree-context-bar">
   <div className="museum-tree-selection">
    <label className="admin-field museum-tree-picker">Find a saint<select value={focus||""} onChange={e=>{setFocus(e.target.value||undefined);setZoom(1);}}><option value="">Choose a saint</option>{layout.nodes.map(n=><option key={n.id} value={n.id}>{n.name}</option>)}</select></label>
    {focused&&!(mobile&&immersive)?<button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setSelected(focused.id)}>Saint details</button>:null}
   </div>
   <details open className="museum-tree-corner-map"><summary>Whole family</summary>
    <svg className="museum-tree-minimap" viewBox={`0 0 ${layout.width} ${layout.height}`} role="group" aria-label={`${label} whole-family map`}>
     {layout.edges.filter(e=>e.secondary!=="shortcut"||secondary).map(e=><path key={e.key} d={e.path} className={`museum-tree-edge museum-tree-edge--${e.kind} museum-tree-lineage-${e.lineage}`}/>)}
     {layout.nodes.map(n=><g key={n.id} transform={`translate(${n.x},${n.y})`} className={`museum-tree-map-node${!n.sourceOnly&&n.presence&&n.presence!=="none"?" museum-tree-map-node--present":""}${focus===n.id?" museum-tree-map-node--focus":""}`} role={mobile?undefined:"button"} tabIndex={mobile?-1:0} aria-label={`Locate ${n.name} in tree`} aria-pressed={mobile?undefined:focus===n.id} onClick={()=>{if(!mobile)setFocus(n.id);}} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setFocus(n.id);}}}><title>{n.name}</title><rect width={cfg.nodeWidth} height={cfg.nodeHeight}/></g>)}
     <rect className="museum-tree-map-window" x={visible.x} y={visible.y} width={visible.width} height={visible.height}/>
    </svg>
    {mobile?<button type="button" className="museum-saint-link" onClick={()=>{setZoom(null);viewport.current?.scrollTo(0,0);}}>Fit whole family</button>:null}
   </details>
  </div>
  <div className="museum-tree-stage">
  {!layout.nodes.length?<p>No active linked saints were found.</p>:<div {...touch} ref={viewport} className="museum-live-tree-viewport museum-live-tree-viewport--labeled" tabIndex={mobile&&!immersive?-1:0} role="region" aria-label={mobile&&immersive?"Relationship diagram. Swipe to pan; pinch to zoom.":"Relationship diagram"}>
   <svg className="museum-live-tree" width={layout.width*effectiveZoom} height={layout.height*effectiveZoom} viewBox={`0 0 ${layout.width} ${layout.height}`} role="group" aria-label={`${label} live relationship diagram`}>
    <defs>{Array.from({length:6},(_,i)=><marker key={i} id={`${prefix}-arrow-${i}`} className={`museum-tree-lineage-${i}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 z"/></marker>)}{Array.from({length:6},(_,i)=><marker key={`successor-${i}`} id={`${prefix}-successor-${i}`} className={`museum-tree-lineage-${i} museum-tree-successor-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10"/></marker>)}</defs>
    {layout.edges.filter(e=>e.secondary!=="shortcut"||secondary).map(e=><path key={e.key} className={`museum-tree-edge museum-tree-edge--${e.kind} museum-tree-lineage-${e.lineage}${e.secondary||e.claims.some(c=>c.status!=="published"||!["certain","traditional"].includes(c.evidence))?" museum-tree-edge--uncertain":""}`} d={e.path} markerEnd={e.kind==="guru"?`url(#${prefix}-arrow-${e.lineage})`:e.kind==="successor"?`url(#${prefix}-successor-${e.lineage})`:undefined}><title>{relationshipText(e)}</title></path>)}
    {layout.nodes.map(n=><g key={n.id} transform={`translate(${n.x},${n.y})`} className={`museum-tree-node museum-tree-node--${n.presence||"none"}${n.id===focus?" museum-tree-node--selected":""}`} role="button" aria-current={n.id===focus?"true":undefined} tabIndex={mobile&&!immersive?-1:0} aria-label={`${n.name}: ${badge(n)}. Select in tree`} onClick={()=>setFocus(n.id)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setFocus(n.id);}}}>
     <title>{n.name+(n.id===focus?" — Selected saint":"")}</title><rect width={cfg.nodeWidth} height={cfg.nodeHeight}/>
     {treeNameLines(n.name,cfg).map((line,i)=><text key={i} x={cfg.nameX} y={cfg.nameY+i*cfg.nameLineHeight} className="museum-tree-name">{line}</text>)}
     <text x={cfg.nameX} y={cfg.metaY} className="museum-tree-meta">{[n.birthYear,n.samadhiYear].filter(y=>y!==null).join("–")}</text>

    </g>)}
   </svg>
  </div>}

  </div>
  {mobile&&!immersive?<button type="button" className="museum-admin-button museum-tree-explore" onClick={()=>setFullscreen(true)}>Explore tree</button>:null}
  {mobile&&immersive?<><div className="museum-tree-mobile-controls"><button type="button" className="museum-admin-button museum-admin-button--secondary" aria-label="Zoom out" onClick={()=>changeZoom(-.25)}>−</button><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={readableFocus}>Recenter</button><button type="button" className="museum-admin-button museum-admin-button--secondary" aria-label="Zoom in" onClick={()=>changeZoom(.25)}>+</button></div>{focused?<section className="museum-tree-bottom-sheet"><button type="button" className="museum-saint-link" aria-expanded={sheet} onClick={()=>setSheet(value=>!value)}><span>{focused.name}</span><span>{sheet?"Close details":"Saint details"}</span></button>{sheet?<div className="museum-tree-bottom-sheet__body"><MuseumSaintProfile titleId={titleId+"-sheet"} profile={data.profiles[focused.id]||{name:focused.name,description:"",images:[],facts:[]}}/><p>{badge(focused)}. An inventory record does not confirm a current physical location.</p><ul>{layout.edges.filter(e=>e.from===focused.id||e.to===focused.id).map(e=><li key={e.key}>{relationshipText(e)}</li>)}</ul></div>:null}</section>:null}</>:null}
  <details className="museum-tree-evidence"><summary>All connections and review evidence ({layout.edges.length})</summary><p>Shortcuts, partner-pair guru links and cycle conflicts remain here including shortcuts hidden from the diagram. “Cycle” flags a direction conflict requiring review.</p><ul>{layout.edges.map(e=><li key={e.key}>{relationshipText(e)}</li>)}</ul></details>
  <details className="museum-tree-evidence"><summary>Saints in this view</summary><ul>{layout.nodes.map(n=><li key={n.id}><button type="button" className="museum-saint-link" onClick={()=>setFocus(n.id)}>{n.name}</button> · {badge(n)}</li>)}</ul></details>
  {fullscreen?<MuseumDetailDialog titleId={diagramTitleId+"-fullscreen"} kicker="Relationship tree" closeLabel="Exit full screen" fullScreen onClose={()=>setFullscreen(false)}><MuseumTreeCanvas headingId={diagramTitleId+"-fullscreen"} data={data} label={label} immersive highlightSaintId={highlightSaintId} initialFocus={focus} onFocusChange={setFocus} initialZoom={zoom} initialCompact={compact}/></MuseumDetailDialog>:null}
  {person?<MuseumDetailDialog titleId={titleId} kicker="Relationship context" closeLabel="Close relationship context" onClose={()=>setSelected(null)}>
   <MuseumSaintProfile titleId={titleId} profile={data.profiles[person.id]||{name:person.name,description:"",images:[],facts:[]}}/>
   <p>{badge(person)}. This describes the selected museum’s records; an absent record does not establish physical absence.</p>
   <h3>Relationships in this view</h3><ul>{layout.edges.filter(e=>e.from===person.id||e.to===person.id).map(e=><li key={e.key}>{relationshipText(e)}</li>)}</ul>
  </MuseumDetailDialog>:null}
 </div>;
}

export function MuseumSaintTree({saintId,sourceId,familyKey,museum,name,showStatus=false}:{showStatus?:boolean;saintId?:string;sourceId?:string;familyKey?:string;museum:"spn"|"vrindavan";name:string}) {
 const [data,setData]=useState<MuseumLiveTree|null>(null),[error,setError]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{if(!saintId&&!familyKey)return;const controller=new AbortController();setData(null);setError(false);
 fetch("/api/admin/museum/relationship-tree",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({museum,seeds:saintId?[saintId]:[],familyKey:familyKey||undefined,includeSource:Boolean(familyKey),includeUnreviewed:true}),signal:controller.signal}).then(async response=>{if(!response.ok)throw Error();return response.json();}).then(result=>{if(!controller.signal.aborted)setData(result);}).catch(()=>{if(!controller.signal.aborted)setError(true);});return()=>controller.abort();
 },[saintId,familyKey,museum,retry]);
 if(error)return <p>Relationships could not be loaded. <button type="button" className="museum-saint-link" onClick={()=>setRetry(n=>n+1)}>Retry</button></p>;
 if(!data)return showStatus?<p role="status">Loading family relationships…</p>:null;
 if(!data.layout.edges.length)return showStatus?<p>No connected family relationships are recorded for this saint yet.</p>:null;
 return <section className="museum-saint-review-section"><MuseumLiveTreeDiagram data={data} label={`Relationships · ${name}`} highlightSaintId={saintId||(sourceId?"source:"+sourceId:undefined)}/></section>;
}
