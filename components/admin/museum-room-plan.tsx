"use client";
import {ROOM_COLUMNS,ROOM_ROWS} from "@/lib/museum-diagram-geometry";
import {useState} from "react";
import {vrindavanVitrines} from "@/lib/museum-move-planner-domain";
import {destinationEligibility,type MuseumRoomLayout} from "@/lib/museum-room-layout";

// Shared schematic from the curator's sketch; never a capacity or scale drawing.
export function MuseumRoomPlan({selected,onSelect,counts={},multiple=false,disabled=false,labels={},onDropSection,dropVitrine=null,mode="assign",countLabel="assigned",layout,itemKind="unknown"}:{
 layout?:MuseumRoomLayout;itemKind?:"general"|"walking_stick"|"unknown";
 countLabel?:string;selected:string[];onSelect:(number:string)=>void;counts?:Record<string,number>;multiple?:boolean;disabled?:boolean;
 dropVitrine?:string|null;labels?:Record<string,string[]>;onDropSection?:(number:string,section:string)=>void;mode?:"assign"|"browse";
}){
 const [over,setOver]=useState<string|null>(null);
 if(layout)return <div className="museum-room-scroll" tabIndex={0} aria-label={`${layout.name} schematic; scroll horizontally on a small screen`}><div className="museum-room museum-room--schematic" style={{gridTemplateColumns:`repeat(${layout.columns},minmax(0,1fr))`,gridTemplateRows:`repeat(${layout.rows},var(--height-museum-schematic-unit))`}} role="group" aria-label={mode==="browse"?"Inspect museum vitrines":"Choose an eligible destination vitrine"}>
  {layout.vitrines.map(v=>{const eligible=destinationEligibility(v,itemKind),blocked=disabled||(mode==="assign"&&!eligible.allowed);return <button type="button" key={v.id} data-museum-vitrine={v.number} data-availability={v.availability} data-restriction={v.restriction} className="museum-room__vitrine" style={{gridColumn:`${v.column} / span ${v.columnSpan}`,gridRow:`${v.row} / span ${v.rowSpan}`}} aria-pressed={selected.includes(v.number)} aria-label={`Vitrine ${v.number}${v.provisional?", provisional number":""}, ${v.position}, ${v.availability}${v.restriction==="walking_sticks"?", walking sticks only":""}${counts[v.number]!==undefined?`, ${counts[v.number]} ${countLabel}`:""}`} title={`${v.position}. ${eligible.reason}`} disabled={blocked} onClick={()=>onSelect(v.number)}>
   <strong>{v.number}{v.provisional?<span aria-hidden="true">*</span>:null}</strong><small>{v.availability==="future"?"Future":v.restriction==="walking_sticks"?"Sticks":v.availability==="new"?"New":""}</small>
  </button>;})}
  {layout.landmarks.map(l=><span className="museum-room__landmark" key={l.id} style={{gridColumn:`${l.column} / span ${l.columnSpan}`,gridRow:`${l.row} / span ${l.rowSpan}`}}>{l.label}</span>)}
 </div></div>;
 return <div className="museum-room" style={{gridTemplateColumns:ROOM_COLUMNS.map(n=>`${n}fr`).join(" "),gridTemplateAreas:ROOM_ROWS.map(row=>`"${row.join(" ")}"`).join(" ")}} role="group" aria-label={mode==="browse"?"Browse planned vitrine contents":multiple?"Choose section vitrines":"Choose destination vitrine"}>
  {vrindavanVitrines.map(number=><button type="button" key={number} className={`museum-room__vitrine museum-room__vitrine--${number}${(over===number||dropVitrine===number)?" museum-room__vitrine--drop":""}`}
   data-museum-vitrine={number} aria-pressed={selected.includes(number)} aria-label={`${number==="0"?"Temple hall, ":""}Vitrine ${number}${counts[number]!==undefined?`, ${counts[number]} saints ${countLabel}`:""}${labels[number]?.length?`, reserved for ${labels[number].join(", ")}`:""}`}
   title={labels[number]?.join(" · ")} disabled={disabled} onClick={()=>onSelect(number)}
   onDragOver={event=>{if(onDropSection&&!disabled&&event.dataTransfer.types.includes("application/x-museum-section")){event.preventDefault();event.dataTransfer.dropEffect="copy";setOver(number);}}}
   onDragLeave={()=>setOver(null)} onDrop={event=>{setOver(null);if(!onDropSection||disabled)return;event.preventDefault();const section=event.dataTransfer.getData("application/x-museum-section");if(section)onDropSection(number,section);}}>
   <strong>{number}</strong>{labels[number]?.length?<small className="museum-room__label">{labels[number][0]}{labels[number].length>1?` +${labels[number].length-1}`:""}</small>:null}
   {counts[number]?<small>{counts[number]} {countLabel}</small>:null}
  </button>)}
  <span className="museum-room__entrance">Entrance ↗</span><span className="museum-room__temple">Temple hall</span>
 </div>;
}
