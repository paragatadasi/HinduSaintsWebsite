"use client";
import Link from "next/link";
import type {Route} from "next";
import {plannerVitrineContents,type PlannerData,type PlannerRow} from "@/lib/museum-move-planner-domain";
import {MuseumDetailDialog} from "./museum-detail-dialog";
import {MuseumPackagingSummary} from "./museum-packaging-summary";

export function MuseumVitrineContents({data,number,onClose}:{data:PlannerData;number:string;onClose:()=>void}) {
 const {exact,flexible,sections,reserved}=plannerVitrineContents(data,number);
 const tierRank=(row:PlannerRow)=>row.tier==="Featured"?0:row.tier==="Secondary"?1:2;
 const list=(rows:PlannerRow[])=><div className="admin-stack">{[...rows].sort((a,b)=>tierRank(a)-tierRank(b)||a.name.localeCompare(b.name)).map(row=><section className="museum-planning-card admin-stack" key={row.id}>
  <div><Link href={`/vrindavanadmin?q=${encodeURIComponent(row.name)}` as Route}>{row.name}</Link><p className="muted">{row.tier==="Featured"?"Primary":row.tier} · {row.section}{row.shelf?` · ${row.shelf}`:""}{row.status==="Implemented"?" · Implemented":""}{row.arrangementNeedsReview?" · Destination needs review":""}</p>{row.family?<small className="muted">{row.family}</small>:null}</div>
 </section>)}</div>;
 return <MuseumDetailDialog titleId="museum-vitrine-contents-title" kicker="Planned contents" closeLabel="Close vitrine contents" onClose={onClose}>
  <div className="admin-stack"><h2 id="museum-vitrine-contents-title">{number==="0"?"Temple hall":"Vitrine "+number}</h2>
  <p>{sections.length?`Reserved for ${sections.join(" · ")}`:"No section area reserved here yet."}</p>
  <h3>{exact.length} saints assigned here</h3>{exact.length?<><MuseumPackagingSummary rows={exact}/>{list(exact)}</>:<p>No exact destinations have been saved here.</p>}
  {flexible.length?<details><summary>{flexible.length} saints flexible across this area</summary><p>These saints may go in this vitrine or another vitrine in their section’s area. They are not counted as assigned here.</p>{list(flexible)}</details>:null}
  {reserved.length?<details><summary>{reserved.length} saints in reserved sections still need destinations</summary><p>Reserving an area does not yet place these saints here. Assign them in their section workspace.</p>{list(reserved)}</details>:null}
  </div>
 </MuseumDetailDialog>;
}
