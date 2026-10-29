"use client";

import {useRef, useState} from 'react';
import {localityLand, localityPoints, projectLocality} from '@/lib/spn-linked-localities';

export function SpnLinkedLocalityMap({points, selected, onSelect, vitrine}: {
  points: typeof localityPoints;
  selected: string | null;
  onSelect: (id: string | null) => void;
  vitrine: string;
}) {
  const [fit, setFit] = useState<'region' | 'places'>('region');
  const [zoom, setZoom] = useState(1);
  const [offset,setOffset] = useState([0,0]);
  const drag = useRef<{x:number;y:number;offset:number[]}|null>(null);
  const coords = points.map(p => projectLocality(p.coordinates));
  const bounds = fit === 'places' && coords.length ? [Math.min(...coords.map(p=>p[0]))-2, Math.min(...coords.map(p=>p[1]))-2, Math.max(...coords.map(p=>p[0]))+2, Math.max(...coords.map(p=>p[1]))+2] : [64,-43,100,-5];
  const width = Math.max(8,bounds[2]-bounds[0]) / zoom, height = Math.max(8,bounds[3]-bounds[1]) / zoom;
  const viewBox = `${(bounds[0]+bounds[2]-width)/2+offset[0]} ${(bounds[1]+bounds[3]-height)/2+offset[1]} ${width} ${height}`;
  const radius = Math.max(width,height)/100;
  return <section className="panel locality-panel" aria-label={`Places linked to Vitrine ${vitrine}`}>
    <p className="eyebrow">Linked places</p><h2>Vitrine {vitrine} on the map</h2>
    <div className="locality-controls"><button aria-pressed={fit==='region'} onClick={()=>{setFit('region');setZoom(1);setOffset([0,0]);}}>South Asia</button><button aria-pressed={fit==='places'} disabled={!points.length} onClick={()=>{setFit('places');setZoom(1);setOffset([0,0]);}}>Fit places</button><button aria-label="Zoom in" disabled={zoom>=8} onClick={()=>setZoom(z=>z*2)}>+</button><button aria-label="Zoom out" disabled={zoom<=1} onClick={()=>setZoom(z=>z/2)}>−</button></div>
    <svg className="locality-map" viewBox={viewBox}
      onPointerDown={e=>{if((e.target as Element).closest('[role="button"]'))return;drag.current={x:e.clientX,y:e.clientY,offset};e.currentTarget.setPointerCapture(e.pointerId);}}
      onPointerMove={e=>{if(!drag.current)return;const box=e.currentTarget.getBoundingClientRect();const scale=Math.max(width/box.width,height/box.height);setOffset([drag.current.offset[0]-(e.clientX-drag.current.x)*scale,drag.current.offset[1]-(e.clientY-drag.current.y)*scale]);}}
      onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}
       role="group" aria-label="Select a highlighted place to filter the vitrine’s saints">
      <g className="locality-land">{localityLand.map((land,i)=><path key={i} d={land.path}/>)}</g>
      <g className="locality-context" aria-hidden="true">{localityPoints.map(p=>{const [x,y]=projectLocality(p.coordinates);return <circle key={p.id} cx={x} cy={y} r={radius/3}/>;})}</g>
      {points.map(p=>{const [x,y]=projectLocality(p.coordinates);return <g key={p.id} role="button" tabIndex={0} aria-label={p.label} aria-pressed={selected===p.id} className="locality-point" onClick={()=>onSelect(selected===p.id?null:p.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(selected===p.id?null:p.id);}}}><title>{p.label}</title><circle className="locality-hit" cx={x} cy={y} r={radius*2}/><circle cx={x} cy={y} r={radius*(selected===p.id?0.9:0.65)}/></g>;})}
    </svg>
    <div className="locality-chips" aria-label="Places in this vitrine"><button aria-pressed={!selected} onClick={()=>onSelect(null)}>All places</button>{points.map(p=><button key={p.id} aria-pressed={selected===p.id} onClick={()=>onSelect(selected===p.id?null:p.id)}>{p.label}</button>)}</div>
    {!points.length?<p className="caption">No mapped places for this vitrine.</p>:<p className="caption">Select a place to see its saints. Place links describe geography, not lineage.</p>}
  </section>;
}
