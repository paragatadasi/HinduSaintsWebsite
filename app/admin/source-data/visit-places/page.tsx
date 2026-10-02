import Link from "next/link";
import type { Route } from "next";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/admin-access";
import { hasCapability } from "@/lib/permissions";
import { visitPlaceSchema, visitPlaceWarnings } from "@/lib/visit-place-domain";
import { stageResearch } from "./actions";

export default async function VisitResearch({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const user=await requireCapability("view_source_data"); const params=await searchParams;
  const status=["approved","deferred","rejected","accepted"].includes(params.status||"") ? params.status! : "pending";
  const all=await db.visitPlaceProposal.findMany({distinct:["sourceKey"],orderBy:[{sourceKey:"asc"},{observedAt:"desc"},{id:"desc"}],include:{saint:{select:{displayName:true,slug:true}},acceptedVisitPlace:true}});
  const q=(params.q||"").trim().slice(0,200).toLowerCase();
  const confidence=["high","medium","low"].includes(params.confidence||"")?params.confidence!:"all";
  const matchesStatus=(row:typeof all[number])=>status==="accepted"?Boolean(row.acceptedVisitPlace):row.status===status&&!row.acceptedVisitPlace;
  const filtered=all.filter(row=>matchesStatus(row) && (confidence==="all"||visitPlaceSchema.safeParse(row.normalizedJson).data?.location_confidence===confidence) && (!q || JSON.stringify(row.normalizedJson).toLowerCase().includes(q)) && (params.catalog!=="review_needed" || row.catalogDecision==="review_needed"));
  const page=Math.max(1,parseInt(params.page||"1")||1); const visible=filtered.slice((page-1)*20,page*20);
  return <div className="admin-stack">
    <h1>Visit-place research</h1>
    <p>Review suggested places people can visit to connect with a saint. Historical saint-place associations and museum relic locations are separate decisions.</p>
    <p>This research queue preserves the original workbook. Marking research ready does not apply changes. Use Review acceptance batch to publish accepted visit destinations and optionally update primary localities.</p>
    {hasCapability(user.roles,"run_imports")?<form action={stageResearch} className="form-stack"><label>Research proposals (JSON)<input type="file" name="proposalFile" accept="application/json,.json" required/></label><button className="admin-form-button">Load research proposals</button></form>:null}
    {params.staged?<p role="status">Loaded {Number(params.staged)||0} proposals; {Number(params.unchanged)||0} unchanged; {Number(params.unmatched)||0} saint identities need investigation.</p>:null}
    {params.error?<p role="alert">The decision could not be saved. Reload the proposal and check its evidence, coordinate precision, confirmation and required follow-up notes. No partial changes were saved.</p>:null}
    <nav aria-label="Research status">{[["accepted","Accepted on website"],["pending","Needs review"],["approved","Ready for publication"],["deferred","Deferred"],["rejected","Not a destination"]].map(([value,label])=><span key={value}><Link aria-current={status===value?"page":undefined} href={`/admin/source-data/visit-places?status=${value}` as Route}>{label} ({all.filter(r=>value==="accepted"?r.acceptedVisitPlace:r.status===value&&!r.acceptedVisitPlace).length})</Link>{" · "}</span>)}</nav>
    <form className="admin-search"><input type="hidden" name="status" value={status}/><label>Find saint or destination<input name="q" defaultValue={q}/></label><label>Research confidence<select name="confidence" defaultValue={confidence}><option value="all">All confidence levels</option>{["high","medium","low"].map(v=><option key={v}>{v}</option>)}</select></label><label>Catalog review<select name="catalog" defaultValue={params.catalog||"all"}><option value="all">All catalog decisions</option><option value="review_needed">Catalog follow-up needed</option></select></label><button className="admin-form-button">Search</button></form>
    {params.accepted?<p role="status">Accepted {Number(params.accepted)||0} visit destinations. Selected primary-locality changes are now saved in the website database.</p>:null}
    {params.acceptError?<p role="alert">No changes were applied. Select at least one eligible proposal, confirm acceptance, and reload the batch preview if any source or website data changed.</p>:null}
    {hasCapability(user.roles,"publish_content")&&status!=="accepted"&&filtered.length>0?<Link className="admin-form-button" href={`/admin/source-data/visit-places/accept?status=${status}&confidence=${confidence}&q=${encodeURIComponent(q)}&catalog=${params.catalog==="review_needed"?"review_needed":"all"}` as Route}>Review acceptance batch ({filtered.length} filtered proposals)</Link>:null}
    <p>{filtered.length} proposals · Page {page}</p>
    <ul>{visible.map(row=>{const parsed=visitPlaceSchema.safeParse(row.normalizedJson);return <li key={row.id}><Link href={`/admin/source-data/visit-places/${row.id}` as Route}>{row.saint?.displayName||parsed.data?.name||"Saint identity unresolved"}</Link>{parsed.success?<> — {parsed.data.visit_place_name}, {[parsed.data.locality,parsed.data.country].filter(Boolean).join(", ")} ({visitPlaceWarnings(parsed.data).length} research checks; {parsed.data.location_confidence} confidence)</>:null}{row.catalogDecision==="review_needed"?" · Catalog follow-up needed":null}</li>;})}</ul>
    <nav aria-label="Research pages">{page>1?<Link href={`/admin/source-data/visit-places?status=${status}&confidence=${confidence}&q=${encodeURIComponent(q)}&catalog=${params.catalog==="review_needed"?"review_needed":"all"}&page=${page-1}` as Route}>Previous</Link>:null}{" "}{page*20<filtered.length?<Link href={`/admin/source-data/visit-places?status=${status}&confidence=${confidence}&q=${encodeURIComponent(q)}&catalog=${params.catalog==="review_needed"?"review_needed":"all"}&page=${page+1}` as Route}>Next</Link>:null}</nav>
  </div>;
}
