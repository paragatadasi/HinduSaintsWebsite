"use client";
import {vrindavanVitrines} from "@/lib/museum-move-planner-domain";

// This room geometry reproduces the curator's numbered sketch, not a scale drawing.
// Grid areas live in shared CSS so the same accessible control serves setup and planning.
export function MuseumRoomPlan({selected,onSelect,counts={},multiple=false,disabled=false}:{selected:string[];onSelect:(number:string)=>void;counts?:Record<string,number>;multiple?:boolean;disabled?:boolean}){
 return <div className="museum-room" role="group" aria-label={multiple?"Select vitrines containing photos":"Choose destination vitrine"}>
  {vrindavanVitrines.map(number=><button type="button" key={number} className={`museum-room__vitrine museum-room__vitrine--${number}`}
   aria-pressed={selected.includes(number)} aria-label={`${number==="0"?"Temple hall, ":""}Vitrine ${number}${counts[number]!==undefined?`, ${counts[number]} saints planned`:""}`}
   disabled={disabled} onClick={()=>onSelect(number)}>
   <strong>{number}</strong>{counts[number]?<small>{counts[number]} saints</small>:null}
  </button>)}
  <span className="museum-room__entrance">Entrance ↗</span>
  <span className="museum-room__temple">Temple hall</span>
 </div>;
}
