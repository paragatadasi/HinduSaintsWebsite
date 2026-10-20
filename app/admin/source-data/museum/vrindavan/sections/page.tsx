import Link from "next/link";
import type {Route} from "next";
import {requireCapability} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {readVrindavanLineageReview} from "@/lib/vrindavan-lineage-review";
import {LINEAGE_RULES} from "@/lib/vrindavan-lineage-domain";
import {ReviewWorkflow,ReviewSection,ReviewFactGrid} from "@/components/admin/review-ui";
import {reviewFamilyAnchor} from "./actions";
export const dynamic="force-dynamic";
export default async function SectionReview({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const user=await requireCapability("view_source_data");await requireCapability("access_museum");await requireCapability("view_full_saint_catalog");
 const [review,params]=await Promise.all([readVrindavanLineageReview(),searchParams]);
 const canApply=hasCapability(user.roles,"manage_museum")&&hasCapability(user.roles,"resolve_reconciliation");
 const status=["changed","unchanged","protected","conflicting","unassigned"].includes(params.status||"")?params.status:"all";
 const q=(params.q||"").trim().slice(0,200).toLowerCase();
 const rows=review.rows.filter(r=>(status==="all"||r.classification===status)&&(!q||[r.name,r.familyLabel,...r.subgroups].join(" ").toLowerCase().includes(q)));
 return <div className="admin-stack"><h1>Vrindavan section reconciliation</h1><p><Link href="/admin/source-data/museum/vrindavan">Identity review</Link> · <Link href="/vrindavanadmin/sections">Museum section proposals</Link></p>
 {params.error?<p role="alert">The review changed or confirmation was incomplete. Reload and review again; no partial update was saved.</p>:null}
 {params.updated!==undefined?<p role="status">{Number(params.updated)||0} section proposals updated. Saved relic locations and curator decisions were preserved.</p>:null}
 {params.anchor?<p role="status">Existing family membership reviewed. Check the refreshed before-and-after proposals.</p>:null}
 <ReviewWorkflow eyebrow="Museum data" title="Keep lineages together within six regions" description="Review current confirmed saints against the agreed lineage-first rules. Explicit curator proposals are protected; conflicting families remain for review.">
 <ReviewSection title="Current coverage"><ReviewFactGrid facts={[{label:"Unique confirmed saints",value:String(review.summary.uniqueConfirmedSaints)},{label:"Regional context candidates",value:String(review.counts.changed)},{label:"Unchanged",value:String(review.counts.unchanged)},{label:"Protected curator decisions",value:String(review.counts.protected)},{label:"Conflicting",value:String(review.counts.conflicting)},{label:"Unassigned",value:String(review.counts.unassigned)},{label:"Pending source rows excluded",value:String(review.summary.excludedPendingSourceRows)}]}/>
 <p>Original subgroups, family IDs and tiers are retained. Regional defaults do not establish historical relationships. Overseas activity alone does not move a lineage into the supplementary context.</p>
 <p><Link href="/admin/source-data/museum/vrindavan/current-state">Download current proposals and families</Link> · <Link href={"/admin/source-data/museum/vrindavan/sections/export" as Route}>Download before-and-after review</Link></p></ReviewSection>
 <ReviewSection title="Regions contain existing subsections"><p role="status">Region-only replacement is disabled. The six regions contain the existing subsections; they do not replace them. Current subsection names, families and relic locations are preserved. The regional context below remains a research preview while family exceptions are reviewed.</p></ReviewSection>
 <ReviewSection title="Review existing display-family anchors"><p>Choose an agreed rule only after confirming that the existing members belong to this display family. This does not add or remove members. Changed membership requires fresh review.</p>
 {review.currentFamilies.map(f=><details key={f.key}><summary>{f.label} · {f.memberIds.length} saints</summary><p>{review.rows.filter(r=>r.familyKey===f.key).map(r=>r.name).join("; ")}</p><p>Current sections: {f.sections.join("; ")}</p>
 {canApply?<form action={reviewFamilyAnchor} className="form-stack"><input type="hidden" name="revision" value={review.revision}/><input type="hidden" name="familyKey" value={f.key}/><label>Agreed family rule<select name="ruleGroup" required defaultValue={review.anchors.find(a=>a.familyKey===f.key)?.ruleGroup||""}><option value="">Choose an applicable reviewed rule</option>{LINEAGE_RULES.map(r=><option key={r.group} value={r.group}>{r.group} → {r.default_section}</option>)}</select></label><label>Review evidence<textarea name="evidence" required maxLength={4000} defaultValue={review.anchors.find(a=>a.familyKey===f.key)?.evidence||""}/></label><label><input type="checkbox" name="confirm" required/> I confirm the listed existing members and this family anchor.</label><button className="admin-form-button">Save family anchor review</button></form>:null}</details>)}
 </ReviewSection></ReviewWorkflow>
 <form className="form-stack"><label>Proposal result<select name="status" defaultValue={status}><option value="all">All</option>{Object.keys(review.counts).map(s=><option key={s} value={s}>{s}</option>)}</select></label><label>Saint or subgroup<input name="q" defaultValue={params.q||""}/></label><button className="admin-form-button">Filter proposals</button></form><p>{rows.length} saints in this view</p>
 {rows.map(r=><ReviewWorkflow key={r.saintId} eyebrow={r.classification} title={r.name} description={r.basis}><ReviewFactGrid facts={[{label:"Retained subsection",value:r.beforeSection},{label:"Regional context to review",value:r.proposedSection||"Unresolved"},{label:"Preserved family",value:r.familyLabel||"No display family"},{label:"Preserved subgroup",value:r.subgroups.join("; ")||"None"},{label:"Tier",value:r.tier}]}/>{r.reviewNotes.map(n=><p key={n}>{n}</p>)}</ReviewWorkflow>)}
 </div>;
}
