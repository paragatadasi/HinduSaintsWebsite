import type { Route } from "next";
import Link from "next/link";
import { ReviewWorkflow, ReviewFactGrid } from "@/components/admin/review-ui";
import { requireCapability } from "@/lib/admin-access";
import { hasCapability } from "@/lib/permissions";
import { db } from "@/lib/db";
import { MuseumUpdateControl } from "@/components/admin/museum-update-control";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { reviewMuseumSource } from "./actions";
export default async function MuseumUpdates({searchParams}:{searchParams:Promise<{status?:string;q?:string;page?:string;error?:string;saved?:string}>}) {
  const user=await requireCapability("view_source_data");const params=await searchParams;
  const status=params.status==="deferred"?"deferred":params.status==="resolved"?"resolved":"pending";
  const q=(params.q||"").trim().slice(0,200); const page=Math.max(1,Math.min(10000,Number.parseInt(params.page||"1")||1));
  const where={status,...(q?{name:{contains:q,mode:"insensitive" as const}}:{})};
  const canReview=hasCapability(user.roles,"resolve_reconciliation");const canLink=canReview;
  const [reviews,count,saints]=await Promise.all([
    db.museumSourceReview.findMany({where,orderBy:[{name:"asc"},{id:"asc"}],skip:(page-1)*20,take:20}),db.museumSourceReview.count({where}),
    canLink?db.saint.findMany({where:{status:{not:"archived"}},select:{id:true,displayName:true,slug:true},orderBy:{displayName:"asc"}}):Promise.resolve([])
  ]);
  return <div className="admin-stack">
    <h1>Museum source updates</h1><p><Link href="/museumadmin/review">Placement review</Link> &middot; <Link href="/museumadmin">Section proposals</Link></p>
    <MuseumUpdateControl canRun={hasCapability(user.roles,"run_imports")}/>
    <p><Link href={"/admin/source-data/museum/relics" as Route}>Connect relics and review location changes</Link></p>
    <h2>Uncertain matches</h2><p>Review source identities and locations in batches. No saint is created or merged automatically. Linking a source does not approve its relic location.</p>
    {params.error?<p role="alert">The record changed or could not be updated. Reload and review its current source and saint link.</p>:null}
    {params.saved?<p role="status">Decision saved. Check for updates again after linking to refresh the location review queue.</p>:null}
    <form className="admin-search"><label>Find a record<input name="q" defaultValue={q}/></label><input type="hidden" name="status" value={status}/><button className="admin-form-button">Search</button></form>
    <nav aria-label="Source review status"><Link href="/admin/source-data/museum">Needs review</Link> &middot; <Link href="/admin/source-data/museum?status=deferred">Deferred</Link> &middot; <Link href="/admin/source-data/museum?status=resolved">Resolved</Link></nav>
    <p>{count} source rows &middot; Page {page}</p>
    {reviews.map(review=>{const snapshot=review.snapshot as {vitrine?:unknown;shelf?:unknown;saintId?:string|null};return <ReviewWorkflow key={review.id} eyebrow="Source review" title={review.name} description={review.reason}>
      <ReviewFactGrid facts={[{label:"Source vitrine",value:typeof snapshot.vitrine==="number"||typeof snapshot.vitrine==="string"?String(snapshot.vitrine):"Not supplied"},{label:"Source shelf",value:typeof snapshot.shelf==="string"?snapshot.shelf:"Not supplied"}]}/>
      <p>Source record: {review.recordId}</p>{review.note?<p>Review note: {review.note}</p>:null}
      {canReview?<form action={reviewMuseumSource} className="form-stack">
        <input type="hidden" name="id" value={review.id}/><input type="hidden" name="version" value={review.updatedAt.toISOString()}/>
        {canLink&&review.reason==="Saint identity needs review"&&status!=="resolved"?<SearchableSelect name="saintId" label="Existing website saint" options={saints.map(s=>({value:s.id,label:s.displayName,description:s.slug}))}/>:null}
        <label>Decision note<textarea name="note" required maxLength={2000}/></label>
        <div className="review-actions">{canLink&&review.reason==="Saint identity needs review"&&status!=="resolved"?<button name="action" value="link" className="admin-form-button">Link to selected saint</button>:null}
        {status!=="deferred"?<button name="action" value="defer" className="admin-form-button">Defer with note</button>:null}{status!=="pending"?<button name="action" value="reopen" className="admin-form-button">Reopen review</button>:null}</div>
      </form>:null}
    </ReviewWorkflow>})}
    <nav aria-label="Review pages">{page>1?<Link href={`/admin/source-data/museum?status=${status}&q=${encodeURIComponent(q)}&page=${page-1}`}>Previous</Link>:null} {page*20<count?<Link href={`/admin/source-data/museum?status=${status}&q=${encodeURIComponent(q)}&page=${page+1}`}>Next</Link>:null}</nav>
  </div>;
}
