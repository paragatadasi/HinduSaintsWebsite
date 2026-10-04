"use client";
import {Clock3,ListChecks,Check} from "lucide-react";
const icons={Proposed:Clock3,Planned:ListChecks,Implemented:Check};
export function MuseumArrangementIndicator({status="Proposed",name,onClick,className=""}:{status?:string;name:string;onClick:()=>void;className?:string}) {
 const label=Object.hasOwn(icons,status)?status:"Proposed",Icon=icons[label as keyof typeof icons];
 return <button type="button" className={`museum-arrangement-indicator ${className}`} title={label} aria-label={`${label}: ${name}. Open placement details`} onClick={onClick}><Icon aria-hidden="true"/></button>;
}
export function MuseumArrangementLegend(){return <p className="museum-arrangement-legend" aria-label="Placement symbols">{Object.entries(icons).map(([label,Icon])=><span key={label}><Icon aria-hidden="true"/>{label}</span>)}</p>;}
