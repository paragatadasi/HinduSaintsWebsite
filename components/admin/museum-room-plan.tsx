"use client";
import {ROOM_COLUMNS,ROOM_ROWS} from "@/lib/museum-diagram-geometry";
import {useState} from "react";
import {vrindavanVitrines} from "@/lib/museum-move-planner-domain";

// Shared schematic from the curator's sketch; never a capacity or scale drawing.
export function MuseumRoomPlan({selected,onSelect,counts={},multiple=false,disabled=false,labels={},onDropSection,dropVitrine=null,mode="assign"}:{
 selected:string[];onSelect:(number:string)=>void;counts?:Record<string,number>;multiple?:boolean;disabled?:boolean;
 dropVitrine?:string|null;labels?:Record<string,string[]>;onDropSection?:(number:string,section:string)=>void;mode?:"assign"|"browse";
}){
 const [over,setOver]=useState<string|null>(null);
 return <div className="museum-room" style={{gridTemplateColumns:ROOM_COLUMNS.map(n=>`${n}fr`).join(" "),gridTemplateAreas:ROOM_ROWS.map(row=>`"${row.join(" ")}"`).join(" ")}} role="group" aria-label={mode==="browse"?"Browse planned vitrine contents":multiple?"Choose section vitrines":"Choose destination vitrine"}>
  {vrindavanVitrines.map(number=><button type="button" key={number} className={`museum-room__vitrine museum-room__vitrine--${number}${(over===number||dropVitrine===number)?" museum-room__vitrine--drop":""}`}
   data-museum-vitrine={number} aria-pressed={selected.includes(number)} aria-label={`${number==="0"?"Temple hall, ":""}Vitrine ${number}${counts[number]!==undefined?`, ${counts[number]} saints assigned`:""}${labels[number]?.length?`, reserved for ${labels[number].join(", ")}`:""}`}
   title={labels[number]?.join(" · ")} disabled={disabled} onClick={()=>onSelect(number)}
   onDragOver={event=>{if(onDropSection&&!disabled&&event.dataTransfer.types.includes("application/x-museum-section")){event.preventDefault();event.dataTransfer.dropEffect="copy";setOver(number);}}}
   onDragLeave={()=>setOver(null)} onDrop={event=>{setOver(null);if(!onDropSection||disabled)return;event.preventDefault();const section=event.dataTransfer.getData("application/x-museum-section");if(section)onDropSection(number,section);}}>
   <strong>{number}</strong>{labels[number]?.length?<small className="museum-room__label">{labels[number][0]}{labels[number].length>1?` +${labels[number].length-1}`:""}</small>:null}
   {counts[number]?<small>{counts[number]} assigned</small>:null}
  </button>)}
  <span className="museum-room__entrance">Entrance ↗</span><span className="museum-room__temple">Temple hall</span>
 </div>;
}
