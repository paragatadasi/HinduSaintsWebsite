import Link from "next/link";
import type {Route} from "next";
import {notFound} from "next/navigation";
import {requireCapability} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {readVrindavanIdentityReview} from "@/lib/vrindavan-identity-review";
import {ReviewWorkflow,ReviewSection,ReviewFactGrid} from "@/components/admin/review-ui";
import {SearchableMultiSelect} from "@/components/ui/searchable-multi-select";
import {reviewVrindavan} from "../actions";
export default async function IdentityDetail({params}:{params:Promise<{id:string}>}){
  const user=await requireCapability("view_source_data");await requireCapability("view_full_saint_catalog");
  const {id}=await params,{rows,saints}=await readVrindavanIdentityReview();const p=rows.find(r=>r.row.id===id);if(!p)notFound();
  return <div className="admin-stack"><Link href={"/admin/source-data/museum/vrindavan" as Route}>Back to matching review</Link><h1>{p.data.name||"Unidentified source row"}</h1>
    <ReviewWorkflow eyebrow={p.row.status} title="Review website saint identity" description={p.identity.method}>
      <ReviewSection title="Source evidence"><ReviewFactGrid facts={[{label:"Workbook",value:p.data.sourceName},{label:"Source row",value:String(p.data.sourceRow)},{label:"Place text",value:p.data.place||"Not supplied"},{label:"Relic description",value:p.data.relic||"Not supplied"},{label:"Amount",value:p.data.quantity||"Not supplied"},{label:"Display / position",value:[p.data.display,p.data.position].filter(Boolean).join(" / ")||"Not supplied"},{label:"Comments",value:p.data.comments||"None"}]}/><p>Source place text is context; it does not update the saint’s primary place or visit destination.</p>{p.data.warnings.length?<ul>{p.data.warnings.map(w=><li key={w}>{w}</li>)}</ul>:null}<details><summary>Preserved workbook evidence, including the other sheet</summary><pre>{JSON.stringify(p.row.rawJson,null,2)}</pre></details></ReviewSection>
      <ReviewSection title="Website candidates"><ul>{p.identity.candidates.map(s=><li key={s.id}>{s.displayName} · {s.status} · {s.slug}</li>)}</ul>{p.identity.candidates.length===0?<p>No clear candidate. Search the full website catalogue below; a failed name match does not establish a new saint.</p>:null}</ReviewSection>
      <ReviewSection title="Identity decision">{p.row.status==="identity_linked"?<><p>Confirmed: {p.data.saintIds.map(id=>saints.find(s=>s.id===id)?.displayName||"Unavailable saint; follow-up required").join("; ")}</p><p>{p.data.note}</p><p>This reviewed decision is preserved. Corrections and cross-snapshot reconciliation are a separate follow-up.</p></>:hasCapability(user.roles,"resolve_reconciliation")?<form action={reviewVrindavan} className="form-stack"><input type="hidden" name="id" value={p.row.id}/><input type="hidden" name="version" value={p.version}/><SearchableMultiSelect name="saintIds" label="Existing website saints" maxSelected={20} options={saints.map(s=>({value:s.id,label:s.displayName,description:`${s.status} · ${s.slug}`,keywords:[s.canonicalName,...s.aliases.map(a=>a.alias)]}))}/><label>Decision note (optional when linking)<textarea name="note" maxLength={2000} defaultValue={p.data.note||""}/></label><p>A note is required to defer. Select multiple saints only when the source evidence names or supports multiple identities.</p><label className="admin-option-toggle admin-option-toggle--inline"><input type="checkbox" name="confirm"/> I confirm the selected website identities. This does not create relics or approve their locations.</label><div className="review-actions"><button name="action" value="link" className="admin-form-button">Save saint links</button><button name="action" value="defer" className="admin-form-button">Defer with note</button></div></form>:<p>Source Data reconciliation permission is required to save this decision.</p>}</ReviewSection>
    </ReviewWorkflow>
  </div>;
}
