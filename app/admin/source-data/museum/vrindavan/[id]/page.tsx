import Link from "next/link";
import type {Route} from "next";
import {notFound} from "next/navigation";
import {requireCapability} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {readVrindavanIdentityReview} from "@/lib/vrindavan-identity-review";
import {ReviewWorkflow,ReviewSection,ReviewFactGrid} from "@/components/admin/review-ui";
import {SearchableMultiSelect} from "@/components/ui/searchable-multi-select";
import {readBinduPrivateMuseumPlan} from "@/lib/bindu-private-museum-record";
import {reviewVrindavan,createBinduRecord} from "../actions";
export default async function IdentityDetail({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{error?:string;created?:string}>}){
  const user=await requireCapability("view_source_data");await requireCapability("view_full_saint_catalog");
  const {id}=await params,{rows,saints}=await readVrindavanIdentityReview();const p=rows.find(r=>r.row.id===id);if(!p)notFound();
  const feedback=await searchParams;
  const canCreate=["resolve_reconciliation","edit_structured_content","access_museum","manage_museum"] as const;
  const creation=canCreate.every(capability=>hasCapability(user.roles,capability))?await readBinduPrivateMuseumPlan(id):null;
  return <div className="admin-stack"><Link href={"/admin/source-data/museum/vrindavan" as Route}>Back to matching review</Link><h1>{p.data.name||"Unidentified source row"}</h1>
    {feedback.error==="create"?<p role="alert">The private record could not be created. Review the refreshed source, catalogue matches and destination below before trying again.</p>:null}
    {feedback.created?<p role="status">Private record created and inventory linked. The museum proposal is saved; no physical move was confirmed.</p>:null}
    <ReviewWorkflow eyebrow={p.row.status} title="Review website saint identity" description={p.identity.method}>
      <ReviewSection title="Source evidence"><ReviewFactGrid facts={[{label:"Workbook",value:p.data.sourceName},{label:"Source row",value:String(p.data.sourceRow)},{label:"Place text",value:p.data.place||"Not supplied"},{label:"Relic description",value:p.data.relic||"Not supplied"},{label:"Amount",value:p.data.quantity||"Not supplied"},{label:"Display / position",value:[p.data.display,p.data.position].filter(Boolean).join(" / ")||"Not supplied"},{label:"Comments",value:p.data.comments||"None"}]}/><p>Source place text is context; it does not update the saint’s primary place or visit destination.</p>{p.data.warnings.length?<ul>{p.data.warnings.map(w=><li key={w}>{w}</li>)}</ul>:null}<details><summary>Preserved workbook evidence, including the other sheet</summary><pre>{JSON.stringify(p.row.rawJson,null,2)}</pre></details></ReviewSection>
      <ReviewSection title="Website candidates"><ul>{p.identity.candidates.map(s=><li key={s.id}>{s.displayName} · {s.status} · {s.slug}</li>)}</ul>{p.identity.candidates.length===0?<p>No clear candidate. Search the full website catalogue below; a failed name match does not establish a new saint.</p>:null}</ReviewSection>
      <ReviewSection title="Identity decision">{p.row.status==="identity_linked"?<><p>Confirmed: {p.data.saintIds.map(id=>saints.find(s=>s.id===id)?.displayName||"Unavailable saint; follow-up required").join("; ")}</p><p>{p.data.note}</p><p>This reviewed decision is preserved. Corrections and cross-snapshot reconciliation are a separate follow-up.</p></>:hasCapability(user.roles,"resolve_reconciliation")?<form action={reviewVrindavan.bind(null,"link")} className="form-stack"><input type="hidden" name="id" value={p.row.id}/><input type="hidden" name="version" value={p.version}/><SearchableMultiSelect name="saintIds" label="Existing website saints" maxSelected={20} options={saints.map(s=>({value:s.id,label:s.displayName,description:`${s.status} · ${s.slug}`,keywords:[s.canonicalName,...s.aliases.map(a=>a.alias)]}))}/><label>Decision note (optional when linking)<textarea name="note" maxLength={2000} defaultValue={p.data.note||""}/></label><p>A note is required to defer. Select multiple saints only when the source evidence names or supports multiple identities.</p><label className="admin-option-toggle admin-option-toggle--inline"><input type="checkbox" name="confirm"/> I confirm the selected website identities. This does not create relics or approve their locations.</label><div className="review-actions"><button className="admin-form-button">Save saint links</button><button formAction={reviewVrindavan.bind(null,"defer")} className="admin-form-button">Defer with note</button></div></form>:<p>Source Data reconciliation permission is required to save this decision.</p>}</ReviewSection>
      {creation?<ReviewSection title="Create the confirmed private museum record">
        <p>For the curator-confirmed identity Bindu Mata. Review existing catalogue matches before creating a record.</p>
        <ReviewFactGrid facts={[{label:"Name",value:creation.draft.name},{label:"Aliases",value:creation.draft.aliases.join(" · ")},{label:"Visibility",value:"Private draft · not published"},{label:"Museum section",value:creation.proposal.section},{label:"Display tier",value:creation.proposal.tier},{label:"Proposed destination",value:creation.proposal.destination.message}]}/>
        {creation.existingSaints.length?<><p>Possible existing records — review and use the existing identity decision above where appropriate.</p><ul>{creation.existingSaints.map(saint=><li key={saint.id}>{saint.name} · {saint.status} · {saint.slug}</li>)}</ul></>:null}
        {creation.blockedReason?<p role="alert">{creation.blockedReason}</p>:null}
        {creation.canCreate?<form action={createBinduRecord} className="form-stack">
          <input type="hidden" name="sourceId" value={creation.sourceId}/><input type="hidden" name="sourceVersion" value={creation.sourceVersion}/><input type="hidden" name="revision" value={creation.revision}/>
          <label className="admin-option-toggle admin-option-toggle--inline"><input type="checkbox" name="confirm" required/> I reviewed the catalogue for alternate names and confirm this source entry identifies Bindu Mata. Create her private draft, link this inventory entry and save the proposal shown above.</label>
          <p>This preserves the source location. It does not publish a public page or confirm a physical move.</p>
          <button className="admin-form-button">Create private record and link inventory</button>
        </form>:null}
      </ReviewSection>:null}
    </ReviewWorkflow>
  </div>;
}
