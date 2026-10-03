"use client";
import {useState,type ReactNode} from "react";
export function BatchReviewSelection({rows}:{rows:Array<{value:string;label:string;blocked:string;detail:ReactNode}>}) {
 const [selected,setSelected]=useState<string[]>([]);
 const eligible=rows.filter(r=>!r.blocked);
 return <div className="admin-stack"><p>{selected.length} selected · {eligible.length} eligible</p><div className="review-actions"><button type="button" className="admin-form-button" onClick={()=>setSelected(eligible.map(r=>r.value))}>Select all eligible</button><button type="button" className="admin-form-button" onClick={()=>setSelected([])}>Clear selection</button></div>{rows.map(row=><section className="review-workflow__section" key={row.value}><label className="admin-option-toggle admin-option-toggle--inline"><input type="checkbox" name="selection" value={row.value} disabled={Boolean(row.blocked)} checked={selected.includes(row.value)} onChange={e=>setSelected(e.target.checked?[...selected,row.value]:selected.filter(v=>v!==row.value))}/>{row.label}</label>{row.blocked?<p>{row.blocked}</p>:null}{row.detail}</section>)}</div>;
}
