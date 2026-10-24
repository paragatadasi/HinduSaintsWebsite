"use client";
import {useEffect,useId,useRef,useState,useMemo,type ReactNode,type CSSProperties} from "react";
import {Maximize2,X} from "lucide-react";
import graph from "@/data/museum/vrindavan-connected-traditions.json";
import {solveWebLayout,type WebNode} from "@/lib/museum-connected-layout";
import {VRINDAVAN_APPROVED_SUBSECTIONS} from "@/lib/vrindavan-approved-subsections";
import {packProposalColumns,moveDiagramGroup,proposalDiagramPositions,vitrineCenter,type DiagramPosition} from "@/lib/museum-diagram-geometry";
import type {DiagramLayouts} from "@/lib/museum-diagram-layout-domain";
import {loadDiagramLayoutsAction,saveDiagramLayoutAction,deleteDiagramLayoutAction} from "@/app/vrindavanadmin/plan/actions";
import {MuseumDetailDialog} from "./museum-detail-dialog";

export function museumRegionIndex(name:string){return graph.regions.findIndex(region=>region.regionName===name);}
function hull(points:number[][]){
 const cross=(o:number[],a:number[],b:number[])=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
 const sorted=[...points].sort((a,b)=>a[0]-b[0]||a[1]-b[1]),lower:number[][]=[],upper:number[][]=[];
 for(const p of sorted){while(lower.length>1&&cross(lower.at(-2)!,lower.at(-1)!,p)<=0)lower.pop();lower.push(p);}
 for(const p of sorted.reverse()){while(upper.length>1&&cross(upper.at(-2)!,upper.at(-1)!,p)<=0)upper.pop();upper.push(p);}
 return lower.slice(0,-1).concat(upper.slice(0,-1)).map(p=>p.join(",")).join(" ");
}
function endpoint(a:WebNode,b:WebNode){const dx=b.x-a.x,dy=b.y-a.y,t=Math.min((a.w/2+3)/Math.max(.01,Math.abs(dx)),(a.h/2+3)/Math.max(.01,Math.abs(dy)));return {x:a.x+dx*t,y:a.y+dy*t};}
const vrindavanDiagramNodes=graph.regions.flatMap((r,i)=>[...r.subsections.map(s=>({id:s.existingSlug,name:s.name,region:r.regionSlug,regionIndex:i})),...VRINDAVAN_APPROVED_SUBSECTIONS.filter(s=>s.region===r.regionName).map(s=>({id:s.slug,name:s.name,region:r.regionSlug,regionIndex:i}))]);
type CompanionProps={section:string;onChoose:(name:string)=>void;available:string[];areas:{section:string;vitrines:string[]}[];areaRevision:string;canEdit:boolean;staleAreas:string[]};
export type ConnectionsGraph={version:string;regions:{regionName:string;regionSlug:string;subsections:{name:string;existingSlug:string;count?:number}[]}[];edges:{source:string;target:string;kind:string;rationale:string;sourceKeys:string[];priorityBoundary:boolean}[];sources:{key:string;url:string;title:string}[]};
type DiagramActions={load:()=>Promise<DiagramLayouts>;save:(input:unknown)=>Promise<{data:DiagramLayouts|null;error:string}>;remove:(input:unknown)=>Promise<{data:DiagramLayouts|null;error:string}>};
const vrindavanActions:DiagramActions={load:loadDiagramLayoutsAction,save:saveDiagramLayoutAction,remove:deleteDiagramLayoutAction};
export function MuseumConnectedTraditions(props:CompanionProps){return <MuseumConnectionsWorkspace {...props} graph={graph} diagramNodes={vrindavanDiagramNodes} museumId="museum-vrindavan" actions={vrindavanActions}/>;}
type DiagramNode={id:string;name:string;region:string;regionIndex:number};
export function MuseumConnectionsWorkspace({section,onChoose,available,areas,areaRevision,canEdit,staleAreas,graph,diagramNodes,museumId,actions,renderSelection}:CompanionProps&{graph:ConnectionsGraph;diagramNodes:DiagramNode[];museumId:DiagramLayouts["museumId"];actions:DiagramActions;renderSelection?:(name:string)=>ReactNode}){
 const hasProposal=museumId==="museum-vrindavan";
 const [expanded,setExpanded]=useState(false),title=useId();
 const [layouts,setLayouts]=useState<DiagramLayouts|null>(null),[preset,setPreset]=useState(hasProposal?"proposal":"original"),[draft,setDraft]=useState<DiagramPosition[]|null>(null);
 const [name,setName]=useState(""),[error,setError]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[confirmSwitch,setConfirmSwitch]=useState<string|null>(null),[deleting,setDeleting]=useState(false),[needsReload,setNeedsReload]=useState(false);
 const [group,setGroup]=useState<string[]>([]),[multi,setMulti]=useState(false);
 const proposal=useMemo(()=>proposalDiagramPositions(diagramNodes,areas),[areas]);
 const stored=layouts?.layouts.find(item=>item.id===preset);
 const positions=draft??(preset==="proposal"?proposal:stored?.positions??null);
 const latest=useRef<DiagramPosition[]>([]);
 async function reload(){setBusy(true);setError("");try{const loaded=await actions.load();setLayouts(loaded);if(preset!=="original"&&preset!=="proposal"&&!loaded.layouts.some(item=>item.id===preset)){setDraft(latest.current);setPreset("original");setName("");setMessage("That saved view was removed. Your displayed positions are kept as an unsaved view.");}setNeedsReload(false);}catch{setError("Saved views could not load. Try again before saving.");}finally{setBusy(false);}}
 useEffect(()=>{void reload();},[]);
 function choose(value:string){setPreset(value);setDraft(null);setGroup([]);setName(layouts?.layouts.find(item=>item.id===value)?.name??"");setMessage("");setConfirmSwitch(null);setDeleting(false);}
 function requestView(value:string){if(draft)setConfirmSwitch(value);else choose(value);}
 async function save(asNew:boolean){if(!layouts)return;setBusy(true);setError("");try{const result=await actions.save({museumId,revision:layouts.revision,...(!asNew&&stored?{id:stored.id}:{}),name,positions:latest.current,...(areaRevision?{areaRevision}:{})});if(result.error||!result.data)throw new Error(result.error);setLayouts(result.data);const saved=result.data.layouts.find(item=>item.name===name.trim());if(saved){setPreset(saved.id);setName(saved.name);setGroup([]);}setDraft(null);setMessage("Diagram view saved. Museum destinations are unchanged.");}catch(e){setError(e instanceof Error?e.message:"The save could not be confirmed. Reload saved views before retrying.");setNeedsReload(true);}finally{setBusy(false);}}
 async function remove(){if(!layouts||!stored)return;setBusy(true);setError("");try{const result=await actions.remove({museumId,revision:layouts.revision,id:stored.id});if(result.error||!result.data)throw new Error(result.error);setLayouts(result.data);choose("original");setDeleting(false);setMessage("Saved diagram view removed.");}catch(e){setError(e instanceof Error?e.message:"Could not remove this view. Reload before trying again.");setNeedsReload(true);}finally{setBusy(false);}}
 const controls=<div className="museum-diagram-controls">
  <label className="admin-field">Diagram view<select value={preset} disabled={busy} onChange={e=>requestView(e.target.value)}><option value="original">Original connections</option>{hasProposal?<option value="proposal">Current museum proposal</option>:null}{layouts?.layouts.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
  {confirmSwitch?<div role="alert"><p>Discard unsaved diagram positions and switch views?</p><div className="review-actions"><button type="button" className="museum-admin-button" onClick={()=>choose(confirmSwitch)}>Discard and switch</button><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setConfirmSwitch(null)}>Keep editing</button></div></div>:null}
  <div className="review-actions"><label className="museum-check-toggle"><input type="checkbox" checked={multi} onChange={e=>setMulti(e.target.checked)}/> Select several boxes</label><span>{group.length} selected{draft?" · Unsaved positions":""}</span>{group.length?<button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setGroup([])}>Clear selection</button>:null}</div>
  <details><summary>Move diagram boxes</summary><p>Shift-click boxes, or turn on Select several boxes. Drag any selected box to move them together. Arrow keys also move the selected boxes.</p></details>
  {canEdit?<details><summary>Save this diagram view</summary><div className="admin-stack"><label className="admin-field">View name<input maxLength={80} value={name} disabled={busy} onChange={e=>setName(e.target.value)}/></label><div className="review-actions"><button type="button" className="museum-admin-button" disabled={busy||!layouts||needsReload||!name.trim()} onClick={()=>save(true)}>Save as new view</button>{stored?<><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy||!layouts||needsReload||!name.trim()} onClick={()=>save(false)}>Update saved view</button><button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy||needsReload} onClick={()=>setDeleting(true)}>Remove saved view</button></>:null}</div>{deleting?<div><p>Remove “{stored?.name}”? This only removes the saved diagram.</p><button type="button" className="museum-admin-button" disabled={busy} onClick={remove}>Remove view</button><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setDeleting(false)}>Keep view</button></div>:null}<p className="muted">Saved views are shared with museum curators. They store diagram positions only.</p></div></details>:null}
  {error?<p role="alert">{error}</p>:null}{message?<p role="status">{message}</p>:null}{!layouts||needsReload?<button type="button" className="museum-admin-button museum-admin-button--secondary" disabled={busy} onClick={reload}>{busy?"Loading saved views…":"Reload saved views"}</button>:null}
 </div>;
 const content=<>{controls}{staleAreas.length?<details><summary>Earlier areas needing review ({staleAreas.length})</summary><p>{staleAreas.join(" · ")}</p><p>These areas are excluded from the current-proposal diagram until reviewed.</p></details>:null}<ConnectionGraph graph={graph} diagramNodes={diagramNodes} renderSelection={renderSelection} section={section} onChoose={onChoose} available={available} positions={positions} proposal={preset==="proposal"} pack={preset==="proposal"&&!draft} areas={areas} group={group} onGroup={setGroup} multi={multi} locked={busy} onPositions={setDraft} onLayout={value=>{latest.current=value;}}/></>;
 return <section className="museum-connections museum-admin-panel"><div className="section-heading"><div className="museum-planning-heading"><p className="eyebrow">Regional connections</p><h3>Connected traditions</h3></div><button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>setExpanded(true)} aria-label="Expand connected traditions"><Maximize2 aria-hidden="true"/></button></div>
 {!expanded?content:null}
 {expanded?<MuseumDetailDialog fullScreen titleId={title} kicker="Planning reference" closeLabel="Close connected traditions" onClose={()=>setExpanded(false)}><h2 id={title}>Connected traditions</h2>{content}</MuseumDetailDialog>:null}</section>;
}
function ConnectionGraph({graph,diagramNodes,renderSelection,section,onChoose,available,positions,proposal,pack,areas,group,onGroup,multi,locked,onPositions,onLayout}:{graph:ConnectionsGraph;diagramNodes:DiagramNode[];renderSelection?:(name:string)=>ReactNode;section:string;onChoose:(name:string)=>void;available:string[];positions:DiagramPosition[]|null;proposal:boolean;pack:boolean;areas:{section:string;vitrines:string[]}[];group:string[];onGroup:(ids:string[])=>void;multi:boolean;locked:boolean;onPositions:(positions:DiagramPosition[])=>void;onLayout:(positions:DiagramPosition[])=>void}){
 const stage=useRef<HTMLDivElement>(null),popup=useRef<HTMLDivElement>(null),close=useRef<HTMLButtonElement>(null),lastLink=useRef<HTMLElement|SVGElement|null>(null);
 const [nodes,setNodes]=useState<WebNode[]>([]),[size,setSize]=useState({width:0,height:0});
 const [selected,setSelected]=useState(section),[focus,setFocus]=useState(false);
 const [edge,setEdge]=useState<{index:number;x:number;y:number}|null>(null);
 const drag=useRef<{id:string;x:number;y:number;nodes:WebNode[];ids:Set<string>;moved:boolean}|null>(null),suppress=useRef(false);
 useEffect(()=>setSelected(section),[section]);
 useEffect(()=>{
  const el=stage.current;if(!el)return;let previous=0,frame=0;
  const layout=()=>{frame=0;const width=el.clientWidth;if(width<1||Math.abs(width-previous)<1)return;previous=width;
   // Geometry derives from the shared card-width token and actual label height.
   const desired=parseFloat(getComputedStyle(el).getPropertyValue("--width-museum-web-node"));
   const gap=parseFloat(getComputedStyle(el).columnGap);
   const w=proposal?Math.max(1,Math.min(desired,width/4-gap)):Math.min(desired,Math.max(120,width*.28));
   const next=diagramNodes.map(n=>({...n,w,h:Math.max(132,(Math.ceil(n.name.length/(w/7))+Math.ceil(graph.regions[n.regionIndex].regionName.length/(w/7)))*18+64),x:0,y:0,vx:0,vy:0}));
   const height=Math.max(720,(Math.ceil(next.length/Math.max(1,Math.floor(width/(w+12))))+2)*(Math.max(...next.map(n=>n.h))+20));
   solveWebLayout(next,graph.edges,width,height);setSize({width,height});setNodes(next);
  };
  const observer=new ResizeObserver(()=>{if(!frame)frame=requestAnimationFrame(layout);});observer.observe(el);layout();
  return()=>{observer.disconnect();cancelAnimationFrame(frame);};
 },[proposal,graph,diagramNodes]);
 const rowHeight=Math.max(96,...nodes.map(n=>n.h))+20;
 const isAssigned=(name:string)=>!!areas.find(a=>a.section===name)?.vitrines.some(v=>vitrineCenter(v));
 const packed=useMemo(()=>packProposalColumns(nodes,proposalDiagramPositions(diagramNodes,areas),size.width,rowHeight),[nodes,areas,size.width,rowHeight]);
 const roomBottom=packed.roomBottom;
 const canvasHeight=proposal?packed.height:size.height;
 useEffect(()=>{
  if(!edge||!popup.current||!stage.current)return;
  const box=stage.current.getBoundingClientRect(),panel=popup.current.getBoundingClientRect();
  const x=Math.max(0,Math.min(edge.x,size.width-panel.width)),top=Math.max(0,-box.top),bottom=Math.min(canvasHeight,window.innerHeight-box.top);
  const y=Math.max(top,Math.min(edge.y,Math.max(top,bottom-panel.height)));
  if(x!==edge.x||y!==edge.y)setEdge({...edge,x,y});
 },[edge,size.width,canvasHeight]);
 const shared=(name:string)=>[...new Set(areas.find(a=>a.section===name)?.vitrines??[])].filter(v=>areas.filter(a=>a.vitrines.includes(v)).length>1);
 const displayed=useMemo(()=>{
  if(!positions)return nodes;
  const placed=nodes.map(n=>{const p=positions.find(p=>p.nodeId===n.id);return p?{...n,x:Math.max(n.w/2,Math.min(size.width-n.w/2,p.x*size.width)),y:Math.max(n.h/2,Math.min(canvasHeight-n.h/2,p.y*canvasHeight))}:n;});
  if(pack)return packed.nodes;
  return placed;
 },[nodes,positions,pack,size,packed,canvasHeight]);
 const normalized=(values:WebNode[])=>values.map(n=>({nodeId:n.id,x:n.x/size.width,y:n.y/canvasHeight}));
 useEffect(()=>{if(size.width&&displayed.length)onLayout(normalized(displayed));});
 const byName=new Map(displayed.map(n=>[n.name,n]));
 const neighbours=new Set(graph.edges.filter(e=>e.source===selected||e.target===selected).flatMap(e=>[e.source,e.target]));
 const dismiss=(restore=false)=>{setEdge(null);if(restore)lastLink.current?.focus({preventScroll:true});};
 return <div className="museum-connected-graph" onKeyDown={event=>{if(event.key==="Escape"&&edge){event.preventDefault();event.stopPropagation();dismiss(true);}}} onPointerDown={event=>{if(edge&&!popup.current?.contains(event.target as Node)&&!(event.target as Element).closest(".museum-web-edge"))dismiss();}}>
  <div className="museum-web-legend"><span>Solid: documented connection</span><span>Dotted: curatorial adjacency</span><span className="museum-web-priority-key">Heavy gold: recommended adjacency</span></div>
  <div className="museum-web-regions">{graph.regions.map((r,i)=><span key={r.regionSlug} data-region={museumRegionIndex(r.regionName)}>{r.regionName}</span>)}</div>
  {proposal?<details><summary>How this view follows the room</summary><p>Four columns follow the room from left to right: left wall, centre-left, centre-right and right wall. Sections spanning columns use their area centre. Thin guides connect displaced labels to their room positions. Shared and multiple vitrines are listed on each box; unassigned sections sit below the room. Positions do not measure capacity.</p></details>:null}
  <label className="museum-check-toggle"><input type="checkbox" checked={focus} onChange={e=>{setFocus(e.target.checked);dismiss();}}/> Focus on selected section</label>
  <div className="museum-web-viewport" data-proposal={proposal}>{proposal?<div className="museum-web-column-headings"><span>Left wall</span><span>Centre-left</span><span>Centre-right</span><span>Right wall</span></div>:null}<div className="museum-web-stage" data-group-mode={multi||group.length>0} ref={stage} style={{height:canvasHeight||undefined}}>
   <svg className="museum-web-lines" viewBox={`0 0 ${size.width||1} ${canvasHeight||1}`} aria-label="Connections between museum sections">
    <g aria-hidden="true" className="museum-web-fields">{graph.regions.map((r,i)=><polygon key={r.regionSlug} data-region={museumRegionIndex(r.regionName)} points={hull(displayed.filter(n=>n.region===r.regionSlug).flatMap(n=>[[n.x-n.w/2-18,n.y-n.h/2-18],[n.x+n.w/2+18,n.y-n.h/2-18],[n.x+n.w/2+18,n.y+n.h/2+18],[n.x-n.w/2-18,n.y+n.h/2+18]]))}/>)}</g>
    {graph.edges.map((e,i)=>{const a=byName.get(e.source),b=byName.get(e.target);if(!a||!b||(focus&&!!selected&&!neighbours.has(e.source))||(focus&&!!selected&&e.source!==selected&&e.target!==selected))return null;const p=endpoint(a,b),q=endpoint(b,a),d=`M${p.x},${p.y} L${q.x},${q.y}`;
     return <a key={i} href="#connection" className="museum-web-edge" aria-label={`${e.priorityBoundary?"Priority adjacency: ":""}${e.source} to ${e.target}: ${e.kind}`} onClick={event=>{event.preventDefault();lastLink.current=event.currentTarget;const rect=stage.current!.getBoundingClientRect();setEdge({index:i,x:event.detail?event.clientX-rect.left:(p.x+q.x)/2,y:event.detail?event.clientY-rect.top:(p.y+q.y)/2});if(!event.detail)requestAnimationFrame(()=>close.current?.focus({preventScroll:true}));}}><path d={d} className={`museum-web-line ${e.kind}${e.priorityBoundary?" priority":""}${edge?.index===i?" selected":""}`}/><path d={d} className="museum-web-hit"/></a>;
    })}
   </svg>
   {proposal?<svg className="museum-web-lines museum-web-guides" aria-hidden="true" viewBox={`0 0 ${size.width||1} ${canvasHeight||1}`}>{displayed.map(n=>{const p=proposalDiagramPositions(diagramNodes,areas).find(p=>p.nodeId===n.id);return p&&isAssigned(n.name)?<line className="museum-web-anchor" key={n.id} x1={p.x*size.width} y1={p.y/.82*roomBottom} x2={n.x} y2={n.y}/>:null;})}</svg>:null}
   {proposal&&pack?<div className="museum-web-unassigned-label" style={{top:roomBottom}}>No saved museum area / area unavailable</div>:null}
   {displayed.map(n=><button type="button" key={n.id} className="museum-web-node" data-region={museumRegionIndex(graph.regions[n.regionIndex].regionName)} data-muted={focus&&!!selected&&!neighbours.has(n.name)&&selected!==n.name} data-group-selected={group.includes(n.id)} aria-pressed={multi?group.includes(n.id):n.name===selected} style={{left:n.x-n.w/2,top:n.y-n.h/2,width:n.w,minHeight:n.h} as CSSProperties} onClick={e=>{if(suppress.current){suppress.current=false;return;}if(multi||e.shiftKey)onGroup(group.includes(n.id)?group.filter(id=>id!==n.id):[...group,n.id]);else{setSelected(n.name);onGroup([]);}dismiss();}}
    onKeyDown={e=>{if(locked)return;const delta=e.shiftKey?20:8,offset=e.key==="ArrowLeft"?[-delta,0]:e.key==="ArrowRight"?[delta,0]:e.key==="ArrowUp"?[0,-delta]:e.key==="ArrowDown"?[0,delta]:null;if(!offset)return;e.preventDefault();const ids=new Set(group.includes(n.id)?group:[n.id]);onPositions(normalized(moveDiagramGroup(displayed,ids,offset[0],offset[1],size.width,canvasHeight)));}}
    onPointerDown={e=>{if(locked||e.button!==0)return;drag.current={id:n.id,x:e.clientX,y:e.clientY,nodes:displayed,ids:new Set(group.includes(n.id)?group:[n.id]),moved:false};}}
    onPointerMove={e=>{const current=drag.current;if(!current||current.id!==n.id)return;const dx=e.clientX-current.x,dy=e.clientY-current.y;if(!current.moved&&Math.hypot(dx,dy)>6){current.moved=true;e.currentTarget.setPointerCapture(e.pointerId);}if(!current.moved)return;onPositions(normalized(moveDiagramGroup(current.nodes,current.ids,dx,dy,size.width,canvasHeight)));}}
    onPointerUp={e=>{suppress.current=!!drag.current?.moved;drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
    onPointerCancel={()=>{drag.current=null;suppress.current=false;}}><small>{graph.regions[n.regionIndex].regionName}</small>{n.name}{proposal?<small>{isAssigned(n.name)?`Vitrines ${[...new Set(areas.find(a=>a.section===n.name)!.vitrines)].join(", ")}`:areas.find(a=>a.section===n.name)?.vitrines.length?"Area geometry unavailable":"No saved museum area"}{shared(n.name).length?` · Shared: ${shared(n.name).join(", ")}`:""}</small>:null}</button>)}
   {edge?<div ref={popup} className="museum-web-popup" role="dialog" aria-label="Connection details" style={{left:edge.x,top:edge.y}}><button ref={close} type="button" className="museum-web-close" onClick={()=>dismiss(true)} aria-label="Close connection details"><X aria-hidden="true"/></button><strong>{graph.edges[edge.index].source} ↔ {graph.edges[edge.index].target}</strong>{graph.edges[edge.index].priorityBoundary?<p className="eyebrow">Recommended physical adjacency</p>:null}<p>{graph.edges[edge.index].kind==="documented"?"Documented historical, biographical or traditional connection":"Proposed curatorial adjacency · not genealogy"}</p><p>{graph.edges[edge.index].rationale}</p><details onToggle={()=>setEdge(current=>current?{...current}:null)}><summary>Sources</summary>{graph.edges[edge.index].sourceKeys.map(key=>{const source=graph.sources.find(s=>s.key===key);if(!source)return null;return <p key={key}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></p>;})}{!graph.edges[edge.index].sourceKeys.length?<p>Curatorial proposal.</p>:null}</details></div>:null}
  </div>
  </div>
  {available.some(name=>!diagramNodes.some(n=>n.name===name))?<details><summary>Sections without a connections diagram</summary><div className="review-actions">{available.filter(name=>!diagramNodes.some(n=>n.name===name)).map(name=><button type="button" key={name} className="museum-admin-button museum-admin-button--secondary" onClick={()=>setSelected(name)}>{name}</button>)}</div><p>These sections remain available in the section navigator.</p></details>:null}
  {renderSelection?renderSelection(selected):<div className="museum-web-selection" aria-live="polite"><strong>{selected}</strong>{available.includes(selected)?<button type="button" className="museum-admin-button museum-admin-button--secondary" onClick={()=>onChoose(selected)}>Arrange this section</button>:<span>No current planning entries</span>}</div>}
  <details><summary>How to read this companion</summary><p>Colours and soft fields group related sections by region. Dragging explores connections only; it does not change saved areas, family membership or saint assignments. Field size and distance do not measure holdings, capacity or evidence.</p><p>Solid lines describe named historical, biographical or traditional connections, not a shared initiating lineage for every saint. Dotted lines suggest curatorial adjacency. Heavier gold links recommend physical adjacency, not stronger evidence.</p></details>
 </div>;
}

