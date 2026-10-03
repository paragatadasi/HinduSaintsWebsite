import Link from "next/link";
import type {Route} from "next";
import {requireCapability} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {readVrindavanIdentityReview} from "@/lib/vrindavan-identity-review";
import {buildVrindavanReviewBatches,vrindavanReviewBatches,vrindavanReviewBatch} from "@/lib/vrindavan-review-batches";
import {identityName} from "@/lib/vrindavan-identity-domain";
import {ReviewWorkflow,ReviewSection,ReviewFactGrid} from "@/components/admin/review-ui";
import {uploadVrindavan} from "./actions";
export default async function VrindavanReview({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const user=await requireCapability("view_source_data");await requireCapability("view_full_saint_catalog");
  const params=await searchParams,{rows,saints}=await readVrindavanIdentityReview();
  const batches=[...new Map(rows.map(p=>[p.row.sourceKey.split(":")[1],{hash:p.row.sourceKey.split(":")[1],name:p.data.sourceName,date:p.row.observedAt.toISOString()}])).values()];
  const batch=batches.some(b=>b.hash===params.batch)?params.batch:batches[0]?.hash;
  const review=buildVrindavanReviewBatches(rows,batch);
  const current=review.current;
  const status=["linked","deferred","remaining"].includes(params.status||"")?params.status:"pending";
  const match=["clear","ambiguous","possible","unmatched","unidentified"].includes(params.match||"")?params.match:"all";
  const reviewBatch=vrindavanReviewBatches.some(b=>b.key===params.reviewBatch)?params.reviewBatch:"all";
  const q=(params.q||"").trim().slice(0,200).toLowerCase();
  const filtered=current.filter(p=>(status==="linked"?p.row.status==="identity_linked":(status==="remaining"?["pending","deferred"].includes(p.row.status):p.row.status===status))&&(reviewBatch==="all"||vrindavanReviewBatch(p)===reviewBatch)&&(match==="all"||p.identity.category===match)&&(!q||[p.data.name,p.data.relic,p.data.place].join(" ").toLowerCase().includes(q)));
  const page=Math.max(1,parseInt(params.page||"1")||1),visible=filtered.slice((page-1)*20,page*20);
  const query=`batch=${batch||""}&status=${status}&match=${match}&reviewBatch=${reviewBatch}&q=${encodeURIComponent(q)}`;
  const pending=current.filter(p=>p.row.status==="pending");
  const clear=pending.filter(p=>p.identity.category==="clear");
  const uniqueNames=new Set(current.filter(p=>p.data.name&&p.identity.category!=="unidentified").map(p=>identityName(p.data.name!))).size;
  return <div className="admin-stack"><h1>Vrindavan saint matching</h1><p><Link href="/admin/source-data/museum">Museum updates</Link></p>
    <ReviewWorkflow eyebrow="Inventory review" title="Connect inventory rows to website saints" description="Matches use current website names and aliases, including existing drafts. Airtable is supporting evidence; it is not the matching target.">
      <ReviewSection title="Load source evidence"><p>Upload the prepared inventory JSON. This saves the original workbook evidence for review. An identical upload preserves decisions. A different workbook creates a separate snapshot; row numbers are not permanent relic IDs.</p>
        {hasCapability(user.roles,"run_imports")?<form action={uploadVrindavan} className="form-stack"><label>Prepared Vrindavan inventory<input type="file" name="inventoryFile" accept=".json,application/json" required/></label><button className="admin-form-button">Load inventory for matching</button></form>:null}
      </ReviewSection>
      <ReviewSection title="Current matching audit"><ReviewFactGrid facts={[{label:"Inventory rows",value:String(current.length)},{label:"Distinct named entries",value:String(uniqueNames)},{label:"Clear pending matches",value:String(clear.length)},{label:"Other pending rows",value:String(pending.length-clear.length)},{label:"Identity links confirmed",value:String(current.filter(p=>p.row.status==="identity_linked").length)},{label:"Website matching targets",value:String(saints.length)}]}/><p>Counts describe source rows and name labels, not individual relics or verified unique people. Multiple website candidates always need review, even when one is an exact name match.</p><p>Confirming an identity does not create a saint, publish a draft, create a physical relic, or assign a vitrine. Movement notes, combined objects and photograph mismatches remain separate inventory decisions.</p></ReviewSection>
      <ReviewSection title="Remaining identity batches"><p>Work through the current website matches in batches. Existing confirmed links stay separate. Deferred rows remain available for review.</p><ul>{review.batches.map(b=><li key={b.key}><Link href={`/admin/source-data/museum/vrindavan?batch=${batch||""}&status=remaining&reviewBatch=${b.key}` as Route}>{b.label} ({b.rows.length})</Link> — {b.description}</li>)}</ul><Link className="admin-form-button" href={`/admin/source-data/museum/vrindavan/review-export${batch?`?batch=${batch}`:""}` as Route}>Download current identity review (JSON)</Link>{review.confirmedLinkAlerts.length?<p role="alert">{review.confirmedLinkAlerts.length} confirmed rows reference unavailable website saints. Review those links separately; no confirmed decision has been changed.</p>:null}</ReviewSection>
    </ReviewWorkflow>
    {params.error?<p role="alert">{params.error==="upload"?"The inventory could not be loaded. Choose the prepared JSON with the original Sheet1 columns. No partial upload was saved.":"The website identities or review changed, or confirmation was missing. Reload and review again. No partial decisions were saved."}</p>:null}
    {params.staged?<p role="status">Loaded {Number(params.staged)||0} source rows; {Number(params.unchanged)||0} unchanged.</p>:null}
    {params.saved?<p role="status">Saved {Number(params.saved)||0} identity decisions. Physical inventory and locations are unchanged.</p>:null}
    <form className="form-stack"><label>Inventory snapshot<select name="batch" defaultValue={batch}>{batches.map(b=><option key={b.hash} value={b.hash}>{b.name} · {b.date.slice(0,10)} · {b.hash.slice(0,8)}</option>)}</select></label><label>Review status<select name="status" defaultValue={status}><option value="pending">Needs review</option><option value="remaining">Needs review and deferred</option><option value="linked">Identity linked</option><option value="deferred">Deferred</option></select></label><label>Review batch<select name="reviewBatch" defaultValue={reviewBatch}><option value="all">All review batches</option>{vrindavanReviewBatches.map(b=><option key={b.key} value={b.key}>{b.label}</option>)}</select></label><label>Match confidence<select name="match" defaultValue={match}><option value="all">All matches</option><option value="clear">Clear name or alias match</option><option value="possible">Possible title or alias variant</option><option value="ambiguous">Multiple website candidates</option><option value="unmatched">No clear match</option><option value="unidentified">No saint identity supplied</option></select></label><label>Find saint or relic<input name="q" defaultValue={q}/></label><button className="admin-form-button">Apply filters</button></form>
    {hasCapability(user.roles,"resolve_reconciliation")&&clear.length>0&&(reviewBatch==="all"||reviewBatch==="clear")&&(match==="all"||match==="clear")?<Link className="admin-form-button" href={`/admin/source-data/museum/vrindavan/accept?batch=${batch}&q=${encodeURIComponent(q)}` as Route}>Review clear matches in a batch</Link>:null}
    <p>{filtered.length} source rows · Page {page}</p>
    {visible.map(p=><ReviewWorkflow key={p.row.id} eyebrow={p.row.status==="identity_linked"?"Identity linked":p.identity.category} title={p.data.name||"Unidentified source row"} description={p.identity.method}>
      <ReviewFactGrid facts={[{label:"Source row",value:String(p.data.sourceRow)},{label:"Relic description",value:p.data.relic||"Not supplied"},{label:"Source display / position",value:[p.data.display,p.data.position].filter(Boolean).join(" / ")||"Not supplied"},{label:"Website candidates",value:p.identity.candidates.map(s=>`${s.displayName} (${s.status})`).join("; ")||"None"},{label:"Confirmed website saints",value:p.data.saintIds.map(id=>saints.find(s=>s.id===id)?.displayName||"Saint unavailable; review required").join("; ")||"Not linked"}]}/>
      {p.data.warnings.length?<ul>{p.data.warnings.map(w=><li key={w}>{w}</li>)}</ul>:null}{p.data.note?<p>Decision note: {p.data.note}</p>:null}{p.missingReviewedTarget?<p role="alert">A previously selected saint is no longer active. Review the identity before importing relics.</p>:null}
      <Link href={`/admin/source-data/museum/vrindavan/${p.row.id}` as Route}>Review identity and source evidence</Link>
    </ReviewWorkflow>)}
    <nav aria-label="Inventory review pages">{page>1?<Link href={`/admin/source-data/museum/vrindavan?${query}&page=${page-1}` as Route}>Previous</Link>:null}{" "}{page*20<filtered.length?<Link href={`/admin/source-data/museum/vrindavan?${query}&page=${page+1}` as Route}>Next</Link>:null}</nav>
  </div>;
}
