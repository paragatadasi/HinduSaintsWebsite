import Link from "next/link";
import type {Route} from "next";
import {requireCapability} from "@/lib/admin-access";
import {readVrindavanIdentityReview} from "@/lib/vrindavan-identity-review";
import {ReviewWorkflow,ReviewSection,ReviewFactGrid} from "@/components/admin/review-ui";
import {BatchReviewSelection} from "@/components/admin/batch-review-selection";
import {linkClearVrindavan} from "../actions";
export default async function ConfirmClear({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  await requireCapability("view_source_data");await requireCapability("view_full_saint_catalog");await requireCapability("resolve_reconciliation");
  const params=await searchParams,{rows}=await readVrindavanIdentityReview();
  const batch=params.batch||rows[0]?.row.sourceKey.split(":")[1];const q=(params.q||"").trim().slice(0,200).toLowerCase();
  const clear=rows.filter(p=>p.row.sourceKey.split(":")[1]===batch&&p.row.status==="pending"&&p.identity.category==="clear"&&(!q||[p.data.name,p.data.relic,p.data.place].join(" ").toLowerCase().includes(q)));
  return <div className="admin-stack"><Link href={`/admin/source-data/museum/vrindavan?batch=${batch||""}` as Route}>Back to matching review</Link><h1>Confirm clear Vrindavan saint matches</h1>
    <ReviewWorkflow eyebrow="Identity review" title={`${clear.length} clear source rows`} description="Confirm only the identity connections you have reviewed. No relics or vitrine assignments are created.">
      <ReviewSection title="Filter this batch"><form className="admin-search"><input type="hidden" name="batch" value={batch||""}/><label>Find saint or relic<input name="q" defaultValue={q}/></label><button className="admin-form-button">Apply filter</button></form><p>Changing the filter clears the selection. Only clear matches appear here; title variants and duplicate candidates require individual review.</p></ReviewSection>
      {clear.length>500?<p>There are too many rows for one batch. Narrow the search to 500 rows or fewer.</p>:<form action={linkClearVrindavan} className="form-stack"><ReviewSection title="Choose identity links"><BatchReviewSelection key={clear.map(p=>p.version).join("|")} rows={clear.map(p=>({value:`${p.row.id}:${p.version}`,label:p.data.name||"Unidentified",blocked:"",detail:<><ReviewFactGrid facts={[{label:"Website saint",value:`${p.identity.candidates[0].displayName} (${p.identity.candidates[0].status})`},{label:"Website profile",value:p.identity.candidates[0].slug},{label:"Source row",value:String(p.data.sourceRow)},{label:"Relic description",value:p.data.relic||"Not supplied"},{label:"Match basis",value:p.identity.method}]}/>{p.data.warnings.length?<ul>{p.data.warnings.map(w=><li key={w}>{w}</li>)}</ul>:null}<Link href={`/admin/source-data/museum/vrindavan/${p.row.id}` as Route}>Review this source row</Link></>}))}/></ReviewSection><ReviewSection title="Confirm selected identities"><label className="admin-option-toggle admin-option-toggle--inline"><input type="checkbox" name="confirm" required/> I confirm these source rows refer to the suggested website saints.</label><button className="admin-form-button">Save selected saint links</button></ReviewSection></form>}
    </ReviewWorkflow>
  </div>;
}
