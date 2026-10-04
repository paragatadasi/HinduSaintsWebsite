import Link from "next/link";
import type {Route} from "next";
import {requireCapability} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {readFamilyTreeReconciliation} from "@/lib/family-tree-reconciliation";
import {ReviewWorkflow,ReviewSection,ReviewFactGrid} from "@/components/admin/review-ui";
import {reconcileConnections} from "./actions";
export default async function FamilyConnections({searchParams}:{searchParams:Promise<{state?:string;page?:string;created?:string;issues?:string;error?:string}>}){
 const actor=await requireCapability("view_source_data");await requireCapability("view_full_saint_catalog");
 const params=await searchParams,review=await readFamilyTreeReconciliation();
 const state=["missing","existing","unresolved","conflict"].includes(params.state||"")?params.state!:"missing";
 const page=Math.max(1,Math.min(10000,parseInt(params.page||"1")||1));const filtered=review.plans.filter(p=>p.state===state);
 return <div className="admin-stack"><h1>Family-tree connection reconciliation</h1><p><Link href="/admin/source-data/museum">Museum source updates</Link></p>
 <ReviewWorkflow eyebrow="Preserved source evidence" title="Connect the original family-tree data" description="Import missing connections from the preserved museum export into the website database. Both endpoint identities must already map uniquely to active website saints.">
 <ReviewSection title="Current comparison"><ReviewFactGrid facts={Object.entries(review.counts).map(([label,value])=>({label,value:String(value)}))}/><p>Connections are deduplicated across reciprocal fields. Family membership alone is not a relationship. Guru connections point from disciple to teacher in the database.</p></ReviewSection>
 <ReviewSection title="Apply missing connections"><p>New connections are private and need review; they appear when pending relationships are included in museum trees. Existing review states, archived connections, saints and placements remain unchanged. Unresolved identities, conflicting decisions and guru cycles become reconciliation issues.</p>
 {params.created!==undefined?<p role="status">{Number(params.created)||0} connections added; {Number(params.issues)||0} new issues recorded.</p>:null}
 {params.error?<p role="alert">No changes were saved. Confirm the import and reload if website identities or connections have changed.</p>:null}
 {hasCapability(actor.roles,"run_imports")&&hasCapability(actor.roles,"resolve_reconciliation")?<form action={reconcileConnections} className="form-stack"><input type="hidden" name="version" value={review.version}/><label><input type="checkbox" name="confirm" required/>Import the uniquely matched missing connections as private records requiring review</label><button className="admin-form-button">Reconcile family-tree connections</button></form>:null}</ReviewSection>
 </ReviewWorkflow>
 <nav aria-label="Connection review status">{["missing","existing","unresolved","conflict"].map(s=><span key={s}><Link href={`/admin/source-data/museum/family-connections?state=${s}` as Route}>{s}</Link>{" Â· "}</span>)}</nav>
 <p>{filtered.length} connections Â· Page {page}</p>
 {filtered.slice((page-1)*30,page*30).map(p=><ReviewWorkflow key={p.key} eyebrow={p.state} title={`${p.fromName} â†’ ${p.toName}`} description={p.reason}><ReviewFactGrid facts={[{label:"Relationship",value:p.kind},{label:"Source IDs",value:`${p.fromRecordId} â†’ ${p.toRecordId}`},{label:"Website IDs",value:`${p.fromId||"Unresolved"} â†’ ${p.toId||"Unresolved"}`},{label:"Family evidence",value:[...new Set(p.evidence.map(e=>e.familyId))].join(", ")} ]}/><details><summary>Preserved source fields</summary><ul>{p.evidence.map((e,i)=><li key={i}>{e.recordId}: {e.field} â†’ {e.target}</li>)}</ul></details></ReviewWorkflow>)}
 <nav aria-label="Connection review pages">{page>1?<Link href={`/admin/source-data/museum/family-connections?state=${state}&page=${page-1}` as Route}>Previous</Link>:null}{" "}{page*30<filtered.length?<Link href={`/admin/source-data/museum/family-connections?state=${state}&page=${page+1}` as Route}>Next</Link>:null}</nav>
 </div>;
}
