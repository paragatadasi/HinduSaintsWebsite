import Link from "next/link";
import {z} from "zod";
import {requireCapability} from "@/lib/admin-access";
import {readMuseumData} from "@/lib/museum-working-data";
import {spnReviewRevision} from "@/lib/spn-proposal-domain";
import {SPN_REGION_GROUPS} from "@/lib/spn-region-navigation";
import {SearchableMultiSelect} from "@/components/ui/searchable-multi-select";
import {ReviewWorkflow,ReviewSection} from "@/components/admin/review-ui";
import {saveSpnProposalAction} from "./actions";

export default async function SpnProposalReview({searchParams}:{searchParams:Promise<{saintId?:string;saved?:string;error?:string}>}){
 await requireCapability("access_museum");await requireCapability("view_source_data");await requireCapability("view_full_saint_catalog");await requireCapability("manage_museum");
 const params=await searchParams;
 const parsed=z.string().cuid().safeParse(params.saintId);
 const data=parsed.success?await readMuseumData():null;
 const rows=data?.placements.filter(p=>p.saintId===parsed.data)||[];
 const row=rows.length===1?rows[0]:null;
 return <div className="admin-stack"><h1>SPN proposal review</h1>
  {params.saved?<p role="status">SPN proposal saved. Existing planned locations and physical confirmations are preserved.</p>:null}
  {params.error?<p role="alert">{params.error}</p>:null}
  <ReviewWorkflow eyebrow="Source Data" title={row?.name||"Review an SPN proposal"} description="Update the SPN section, display tier, family or museum regions after reviewing the evidence. Website geography and Vrindavan proposals stay unchanged.">
   <ReviewSection title="Find a website record"><form className="admin-form" method="get"><label>Website record ID<input name="saintId" defaultValue={params.saintId||""} required/></label><button className="admin-form-button">Open proposal</button></form></ReviewSection>
   {row&&data?<ReviewSection title="Current proposal">
    <p>{row.section} · {row.tier==="Featured"?"Primary":row.tier} · {row.groupLabel||row.curatorialFamily||row.familyId||"No display family"}</p>
    {row.spnRegionTags?.length?<p>Museum regions: {row.spnRegionTags.join(" · ")}</p>:null}
    {row.spnProposal?<p role={row.spnProposal.state==="needs_review"?"alert":"status"}>{row.spnProposal.state==="applied"?"Confirmed SPN decision":"A previous SPN decision needs review because its underlying proposal changed"}: {row.spnProposal.reason}</p>:null}
    <p>Arrangement: {row.arrangement?.status||"Proposed"}{row.arrangement?.vitrine?` · Vitrine ${row.arrangement.vitrine}`:""}{row.arrangement?.shelf?` · Shelf ${row.arrangement.shelf}`:""}. Saving does not confirm a physical move.</p>
    <form action={saveSpnProposalAction} className="admin-form">
     <input type="hidden" name="saintId" value={row.saintId}/><input type="hidden" name="revision" value={spnReviewRevision(row)}/>
     <label>Section<select name="section" defaultValue={row.section}>{data.sections.map(s=><option key={s.name} value={s.name}>{s.name}</option>)}</select></label>
     <label>Display tier<select name="tier" defaultValue={row.tier}><option value="Featured">Primary</option><option value="Secondary">Secondary</option><option value="Tertiary">Tertiary</option></select></label>
     <label>Display family<select name="familyKey" defaultValue={row.curatorialFamily||row.familyId||""}><option value="">No display family</option>{[...new Map(data.sections.flatMap(s=>s.families.map(f=>[f.key,{...f,section:s.name}] as const))).values()].map(f=><option key={f.key} value={f.key}>{f.label} — {f.section}</option>)}</select></label>
     <p>Choose a family belonging to the selected section.</p>
     <input type="hidden" name="regionTagsPresent" value="yes"/>
     <SearchableMultiSelect key={`${row.id}:${row.spnProposal?.eventId??"source"}`} name="regionTags" label="Museum regions" options={SPN_REGION_GROUPS.map(group=>({value:group.title,label:group.title}))} defaultSelectedValues={row.spnRegionTags??[]}/>
     <p>Optional display-region tags. Leave empty to use the section's region. These do not change website places or traditions.</p>
     <label>Decision reason<textarea name="reason" required maxLength={4000} defaultValue={row.spnProposal?.reason||""}/></label>
     <button className="admin-form-button">Confirm SPN proposal</button>
    </form>
   </ReviewSection>:params.saintId?<ReviewSection title="Review needed"><p>No single active SPN proposal was found for this record. Resolve missing or competing source identities first.</p></ReviewSection>:null}
  </ReviewWorkflow><Link href="/admin/source-data/museum">Back to museum source updates</Link>
 </div>;
}
