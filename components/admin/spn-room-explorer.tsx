"use client";
import {useMemo,useState} from 'react';
import {RotateCcw,RotateCw,HelpCircle,MoveHorizontal,GitBranch} from 'lucide-react';
import type baseline from '@/data/museum/spn-room-proposal-v15.json';
import {showFlexibleSpace,type ExplorerObservation} from '@/lib/spn-room-proposal';

type Proposal=Omit<typeof baseline,'rows'|'namedOnly'>;
const views=[
 {label:'Up',angle:90,transform:'translate(470 0) rotate(90)',cave:[235,-28],entry:[235,782],arrow:'↑',back:'↓'},
 {label:'Right',angle:180,transform:'translate(740 470) rotate(180)',cave:[785,235],entry:[-45,235],arrow:'→',back:'←'},
 {label:'Down',angle:270,transform:'translate(0 740) rotate(270)',cave:[235,782],entry:[235,-28],arrow:'↓',back:'↑'},
 {label:'Left',angle:0,transform:'',cave:[-45,235],entry:[785,235],arrow:'←',back:'→'}
];
const geometry=(v:Proposal['layout']['vitrines'][number])=>({x:(v.row-1)*16+32,y:(25-v.column-v.columnSpan)*17+38,w:v.rowSpan*16-5,h:v.columnSpan*17-5});
const rank=(tier:string)=>tier==='Primary'||tier==='Featured'?0:tier==='Secondary'?1:2;

export function SpnRoomExplorer({proposal,rows}:{proposal:Proposal;rows:ExplorerObservation[]}){
 const [selected,setSelected]=useState('14'),[direction,setDirection]=useState(3),[query,setQuery]=useState('');
 const [lens,setLens]=useState('all'),[hover,setHover]=useState<string|null>(null);
 const view=views[direction],portrait=view.angle%180!==0;
 const changedCases=useMemo(()=>new Set(rows.filter(r=>r.reviewReason).flatMap(r=>[r.vitrine,r.effectiveVitrine])),[rows]);
 const changed=rows.filter(r=>r.reviewReason);
 const assignment=proposal.assignments.find(a=>a.number===selected);
 const indicator=proposal.indicators.find(i=>i.vitrine===selected);
 const contents=useMemo(()=>{
  const groups=new Map<string,{row:ExplorerObservation;sourceIds:string[]}>();
  rows.filter(r=>r.effectiveVitrine===selected).forEach(row=>{
   const key=(row.saintId||row.sourceId)+(row.unresolved?'-review':'');
   const existing=groups.get(key);
   if(existing)existing.sourceIds.push(row.sourceId);else groups.set(key,{row,sourceIds:[row.sourceId]});
  });
  return [...groups.values()].sort((a,b)=>rank(a.row.tier)-rank(b.row.tier)||a.row.name.localeCompare(b.row.name));
 },[rows,selected]);
 const matches=useMemo(()=>new Set(rows.filter(r=>`${r.name} ${r.section} ${r.effectiveVitrine}`.toLowerCase().includes(query.toLowerCase())).map(r=>r.effectiveVitrine)),[rows,query]);
 const drivers=proposal.drivers.filter(d=>d.places.map(String).includes(selected));
 const bridgeDrivers=proposal.drivers.filter(d=>d.places.length<=6&&!/lower review|coherent main/i.test(d.connection));
 const hoverAssignment=proposal.assignments.find(a=>a.number===hover);
 const hoverPrimaries=[...new Set(rows.filter(r=>r.effectiveVitrine===hover&&rank(r.tier)===0&&!r.unresolved).map(r=>r.name))].slice(0,3);
 const hasReview=!!indicator?.hasUnresolvedHoldings||contents.some(c=>c.row.unresolved);
 function choose(number:string){setSelected(number);setHover(null);}
 function contentList(unresolved:boolean){return <ul className="spn-explorer__records">{contents.filter(c=>c.row.unresolved===unresolved).map(({row,sourceIds})=><li key={row.saintId||row.sourceId}>
  <strong>{row.name}</strong><small>{row.tier==='Featured'?'Primary':row.tier}{row.regions.length&&!unresolved?` · ${row.regions.join(' · ')}`:''}</small>
  {row.reviewReason?<p className="spn-explorer__notice">{row.reviewReason}. V15 suggests {row.vitrine}; current {row.currentStatus.toLowerCase()}{row.currentVitrine?` destination ${row.currentVitrine}`:''}.</p>:null}
  <details><summary>Source and placement details</summary><p>Source-reported location: {row.sourceVitrine?`Vitrine ${row.sourceVitrine}${row.sourceShelf?` · Shelf ${row.sourceShelf}`:''}`:'Not recorded'}.</p>
   <p>V15 proposed destination: Vitrine {row.vitrine}. {unresolved?'Separate lower display; identity remains under review.':'Principal anchors first, then secondary saints and close families.'}</p>
   {row.currentVitrine?<p>Current saved {row.currentStatus.toLowerCase()} destination: {row.currentVitrine}{row.currentShelf?` · ${row.currentShelf}`:''}.</p>:null}
   {!row.baseline?<p>No working placement was present at the source snapshot. This remains a source-level proposal.</p>:null}
   <p className="muted">{sourceIds.some(Boolean)?`Source records: ${sourceIds.filter(Boolean).join(', ')}.`:'No linked source observation; footprint unknown.'} {row.allocationKind}.</p></details>
 </li>)}</ul>;}
 return <section className="spn-explorer admin-stack" aria-label="SPN room proposal explorer">
  <header className="museum-planning-heading"><p className="eyebrow">Explore the proposed room</p><h2>Related saints, together</h2><p>Select a vitrine to see its main families, primary saints and the connections behind its position.</p></header>
  <div className="spn-explorer__toolbar"><label>Proposal<select value={proposal.version} onChange={()=>{}}><option value={proposal.version}>{proposal.title}</option></select></label>
   <label>Find a saint or section<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, section or vitrine"/></label>
   <label>Highlight<select value={lens} onChange={e=>setLens(e.target.value)}><option value="all">All vitrines</option><option value="primary">Primary saints</option><option value="review">Identity under review</option><option value="flexible">Potential flexible space</option></select></label>
  </div>
  <p className="muted">Proposal only · Current curator destinations are retained. Display bands are suggestions, not numbered shelves or confirmed moves.</p>
  {changed.length?<details className="spn-explorer__notice"><summary>{changed.length} proposal entries have current-record differences</summary><p>Current names, tiers, region tags and saved destinations take precedence. Review these differences before moving anything. Space cues are withheld in affected vitrines.</p><ul>{changed.map(r=><li key={r.sourceId||r.saintId}><button type="button" className="museum-saint-link" onClick={()=>choose(r.effectiveVitrine)}>{r.name} · {r.reviewReason}</button></li>)}</ul></details>:null}
  {query?<div className="spn-explorer__results" aria-live="polite">{matches.size?proposal.layout.vitrines.filter(v=>matches.has(v.number)).map(v=><button type="button" key={v.number} className="museum-admin-button museum-admin-button--secondary" onClick={()=>choose(v.number)}>Vitrine {v.number}</button>):<p>No proposal entries match your search.</p>}</div>:null}
  <div className="spn-explorer__workspace" data-portrait={portrait}>
   <div className="museum-admin-panel spn-explorer__map-panel">
    <div className="spn-explorer__map-heading"><div><p className="eyebrow">Proposed arrangement</p><h3>The whole room</h3></div><div className="spn-explorer__turn" role="group" aria-label="Rotate room view"><button type="button" className="museum-admin-button museum-admin-button--secondary" aria-label="Turn view anticlockwise" onClick={()=>{setDirection((direction+3)%4);setHover(null);}}><RotateCcw size={18}/></button><span aria-live="polite"><small>Cave</small>{view.label}</span><button type="button" className="museum-admin-button museum-admin-button--secondary" aria-label="Turn view clockwise" onClick={()=>{setDirection((direction+1)%4);setHover(null);}}><RotateCw size={18}/></button></div></div>
    <div className="spn-explorer__legend"><span><HelpCircle size={15}/> Identity under review</span><span><MoveHorizontal size={15}/> Potential flexible space</span><span><i className="spn-explorer__bridge-dot"/> Key bridge</span><span>* Provisional number</span></div>
    <svg className="spn-explorer__map" viewBox={portrait?'0 -60 470 860':'-100 0 940 470'} role="group" aria-label={`SPN proposed room, Babaji Cave ${view.label.toLowerCase()}`} onKeyDown={e=>{if(e.key==='Escape')setHover(null);}}>
     <g transform={view.transform}><path className="spn-explorer__room" d="M32 432V105H440V20H704V432Z"/>
      {proposal.layout.vitrines.map(v=>{
       const a=proposal.assignments.find(item=>item.number===v.number),i=proposal.indicators.find(item=>item.vitrine===v.number),g=geometry(v);
       const review=!!i?.hasUnresolvedHoldings||rows.some(r=>r.effectiveVitrine===v.number&&r.unresolved);
       const flex=showFlexibleSpace(v.number,!!i?.potentialFlexibleSpace,changedCases.has(v.number));
       const primary=rows.some(r=>r.effectiveVitrine===v.number&&rank(r.tier)===0);
       const dim=(!!query&&!matches.has(v.number))||(lens==='primary'&&!primary)||(lens==='review'&&!review)||(lens==='flexible'&&!flex);
       const bridges=bridgeDrivers.filter(d=>d.places.map(String).includes(v.number));
       return <g key={v.number} role="button" tabIndex={0} aria-pressed={selected===v.number} aria-label={`Vitrine ${v.number}, ${a?.subsection??'Future space'}${review?', identity under review':''}${flex?', potential flexible space':''}`} className="spn-explorer__case" data-region={a?.group??'R'} data-selected={selected===v.number} data-dim={dim} data-future={v.availability==='future'} onClick={()=>choose(v.number)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(v.number);}}} onPointerEnter={e=>{if(e.pointerType!=='touch')setHover(v.number);}} onPointerLeave={()=>setHover(null)} onFocus={()=>setHover(v.number)} onBlur={()=>setHover(null)}>
        <rect x={g.x} y={g.y} width={g.w} height={g.h} rx={3}/><g transform={`rotate(${-view.angle} ${g.x+g.w/2} ${g.y+g.h/2})`}><text x={g.x+g.w/2} y={g.y+g.h/2} dominantBaseline="central">{v.number}{v.provisional?'*':''}</text>
         <text className="spn-explorer__map-indicator" x={g.x+g.w/2} y={g.y+g.h/2+10}>{review?'? ':''}{flex?'↔':''}</text></g>{bridges.length?<circle className="spn-explorer__map-bridge" cx={g.x+g.w-5} cy={g.y+5} r={2}/>:null}
       </g>;
      })}</g>
     <text className="spn-explorer__landmark" x={view.cave[0]} y={view.cave[1]}>{view.arrow}<tspan x={view.cave[0]} dy={18}>Babaji Cave</tspan></text><text className="spn-explorer__landmark" x={view.entry[0]} y={view.entry[1]}>{view.back}<tspan x={view.entry[0]} dy={18}>Entrance</tspan></text>
    </svg>
    <div className="spn-explorer__hover" aria-live="polite">{hover?<><p className="eyebrow">Vitrine {hover}</p><strong>{hoverAssignment?.subsection??'Future space · unavailable'}</strong>{hoverPrimaries.length?<p>{hoverPrimaries.join(' · ')}</p>:null}<small>{proposal.drivers.find(d=>d.places.map(String).includes(hover))?.connection??'Select to explore this vitrine.'}</small></>:<p className="muted">Point to a vitrine for a quick preview, or select it for details.</p>}</div>
    <details><summary>How to read the space cues</summary><p>Five recorded source-shelf shares is a historical comparison reference, not measured capacity. “Potential flexible space” means at least one comparison share of headroom. Unknown-size records are not empty space. Lower-review holdings are already included in the total.</p><p>Layout is schematic. Verify object fit, large objects and display heights in the room.</p></details>
   </div>
   <aside className="museum-admin-panel spn-explorer__inspector" aria-label="Selected vitrine details">
    <p className="eyebrow">{assignment?.region??'Future space'}</p><h2>Vitrine {selected}</h2><h3>{assignment?.subsection??'Not available for this reorganization'}</h3>
    <div className="spn-explorer__badges">{hasReview?<span><HelpCircle size={16}/> Identity under review · lower display</span>:null}{showFlexibleSpace(selected,!!indicator?.potentialFlexibleSpace,changedCases.has(selected))?<span><MoveHorizontal size={16}/> Potential flexible space</span>:null}</div>
    {indicator?.flexibleSpaceExclusion?<p className="spn-explorer__notice">{indicator.flexibleSpaceExclusion}</p>:null}{indicator?.specialFitNote?<p>{indicator.specialFitNote}</p>:null}
    {indicator&&indicator.unknownShelfSourceObservationCount>0?<p className="spn-explorer__notice">Fit check needed · {indicator.unknownShelfSourceObservationCount} source observations have no measured footprint.</p>:null}
    {contents.some(c=>!c.row.sourceId)?<p className="spn-explorer__notice">This vitrine also includes named placements without a linked source observation. Their footprint needs checking.</p>:null}
    {indicator?.potentialFlexibleSpace&&selected==='4'?<p>Any flexibility here is reserved for the Sai / Meher group.</p>:null}
    {indicator?<p className="muted">V15 estimate: {indicator.totalObservedShelfShares.toFixed(2)} recorded shelf shares, including lower-review holdings.{changedCases.has(selected)?' Current-record changes require a fresh fit review.':''}</p>:null}
    <h4>Main families and saints</h4>{contentList(false)}{!contents.some(c=>!c.row.unresolved)?<p>No named main-display entries in this proposal. This does not establish that the vitrine is empty.</p>:null}
    {hasReview?<details className="spn-explorer__review"><summary>Identity under review · {contents.filter(c=>c.row.unresolved).length} named / source entries</summary><p>Keep these in a separate lower display. Their placement does not assign the host region or lineage, or resolve their identity.</p>{contentList(true)}</details>:null}
    {drivers.length?<section><h4><GitBranch size={17}/> Why these neighbours?</h4>{drivers.map((d,i)=><details key={i}><summary>{d.connection}</summary><p>{d.reason}</p><div className="spn-explorer__results">{d.places.map(n=><button type="button" key={n} className="museum-admin-button museum-admin-button--secondary" onClick={()=>choose(String(n))}>{n}</button>)}</div></details>)}</section>:null}
   </aside>
  </div>
 </section>;
}
