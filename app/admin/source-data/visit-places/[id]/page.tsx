import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/admin-access";
import { hasCapability } from "@/lib/permissions";
import { visitPlaceSchema,visitPlaceWarnings,externalResearchUrls } from "@/lib/visit-place-domain";
import { ReviewWorkflow,ReviewSection,ReviewFactGrid } from "@/components/admin/review-ui";
import { reviewResearch } from "../actions";

export default async function ResearchDetail({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|undefined>>}) {
  const user=await requireCapability("view_source_data");const {id}=await params;const query=await searchParams;
  const row=await db.visitPlaceProposal.findUnique({where:{id},include:{saint:{include:{places:{include:{place:true}}}}}});
  if(!row)notFound(); const parsed=visitPlaceSchema.safeParse(row.normalizedJson);if(!parsed.success)notFound();const source=parsed.data;
  const latest=await db.visitPlaceProposal.findFirst({where:{sourceKey:row.sourceKey},orderBy:[{observedAt:"desc"},{id:"desc"}]});
  const canReview=hasCapability(user.roles,"edit_structured_content")&&latest?.id===row.id&&row.status!=="superseded";
  const complete=["approved","rejected"].includes(row.status);
  return <div className="admin-stack"><p><Link href={"/admin/source-data/visit-places" as Route}>Visit-place research</Link></p>
    <h1>{row.saint?.displayName||source.name}</h1>{query.saved?<p role="status">Research decision saved. Public website data is unchanged.</p>:null}
    <ReviewWorkflow eyebrow={row.status==="approved"?"Ready for publication":row.status} title={source.visit_place_name} description="Confirm the destination separately from any correction to historical places.">
      <ReviewSection title="Current website context"><ReviewFactGrid facts={[{label:"Website saint",value:row.saint?<Link href={`/admin/saints/${row.saint.id}` as Route}>{row.saint.displayName}</Link>:"No exact active website slug match. Identity investigation is required."},{label:"Current website places",value:row.saint?.places.map(p=>`${p.place.name} (${p.placeType})`).join("; ")||"None"},{label:"Older catalog context from workbook",value:source.catalog_places||"Blank in workbook; this does not mean remove existing places."}]}/></ReviewSection>
      <ReviewSection title="Research proposal"><ReviewFactGrid facts={[{label:"Destination",value:source.visit_place_name},{label:"Kind",value:source.visit_place_kind},{label:"Geography",value:[source.locality,source.state_or_region,source.country].filter(Boolean).join(", ")},{label:"Coordinates",value:source.latitude==null?"Unknown":`${source.latitude}, ${source.longitude} (${source.coordinatePrecision})`},{label:"Researcher confidence",value:source.location_confidence},{label:"Research notes",value:source.research_notes},{label:"Supplied sources",value:source.sources},{label:"Last decision",value:row.decisionNote||"No additional note"},{label:"Reviewed evidence",value:row.evidence||"Not recorded"}]}/><ul>{externalResearchUrls(source.sources).map(url=><li key={url}><a href={url} target="_blank" rel="noreferrer">{url}</a></li>)}</ul><ul>{visitPlaceWarnings(source).map(w=><li key={w}>{w}</li>)}</ul></ReviewSection>
      {canReview?<ReviewSection title={complete?"Reopen research":"Review destination and catalog associations"}><form action={reviewResearch} className="form-stack">
        <input type="hidden" name="id" value={id}/><input type="hidden" name="version" value={row.version}/><input type="hidden" name="name" value={source.name}/><input type="hidden" name="slug" value={source.slug}/><input type="hidden" name="sources" value={source.sources}/><input type="hidden" name="catalog_places" value={source.catalog_places}/>
        <label>Visit place name<input name="visit_place_name" defaultValue={source.visit_place_name} required maxLength={500}/></label>
        <label>Visit place kind<select name="visit_place_kind" defaultValue={source.visit_place_kind}>{["ashram","temple","samadhi","locality","house","other"].map(k=><option key={k}>{k}</option>)}</select></label>
        <label>Locality<input name="locality" defaultValue={source.locality} maxLength={500}/></label><label>State or region<input name="state_or_region" defaultValue={source.state_or_region} maxLength={500}/></label><label>Country<input name="country" defaultValue={source.country} required maxLength={200}/></label>
        <label>Latitude<input name="latitude" defaultValue={source.latitude??""} type="number" step="any" min={-90} max={90}/></label><label>Longitude<input name="longitude" defaultValue={source.longitude??""} type="number" step="any" min={-180} max={180}/></label>
        <label>Coordinate precision<select name="coordinatePrecision" defaultValue={source.coordinatePrecision}>{[["unverified","Not yet verified"],["site","Specific site"],["locality","Approximate locality"],["region","Approximate region"],["unknown","Unknown; no coordinates"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
        <label>Research confidence<select name="location_confidence" defaultValue={source.location_confidence}>{["high","medium","low"].map(v=><option key={v}>{v}</option>)}</select></label>
        <label>Research notes<textarea name="research_notes" defaultValue={source.research_notes} maxLength={10000}/></label>
        <label>Verified evidence<textarea name="evidence" defaultValue={row.evidence||""} placeholder="Specific source links, book/page references, or documented team research supporting this destination and coordinate precision." maxLength={15000}/></label>
        <label className="admin-option-toggle admin-option-toggle--inline"><input type="checkbox" name="confirm"/> I have checked the saint connection and destination, including whether this is a specific site or a broader pilgrimage context.</label>
        <label>Catalog-place decision<select name="catalogDecision" defaultValue={row.catalogDecision}><option value="unreviewed">Not reviewed yet</option><option value="keep">Keep current website associations</option><option value="review_needed">Existing associations need a separate correction review</option></select></label>
        <label>Catalog follow-up<textarea name="catalogNote" defaultValue={row.catalogNote||""} placeholder="For corrections, identify the association, proposed change, and evidence. This decision will not apply the change." maxLength={5000}/></label>
        <label>Decision note (optional for approval)<textarea name="note" defaultValue="" placeholder="Required when deferring, rejecting, or reopening." maxLength={5000}/></label>
        <div className="review-actions">{complete?<button name="action" value="reopen" className="admin-form-button">Reopen research</button>:<><button name="action" value="approve" className="admin-form-button" disabled={!row.saint}>Mark research ready</button><button name="action" value="defer" className="admin-form-button">Defer for research</button><button name="action" value="reject" className="admin-form-button">Not a confirmed destination</button></>}</div>
      </form></ReviewSection>:null}
      <ReviewSection title="Import provenance"><p>{row.sourceName}, sheet {row.sourceSheet}, row {row.sourceRow}. Imported {row.observedAt.toISOString()}. Website timestamp in workbook is snapshot context, not the research verification date.</p><details><summary>Original workbook values</summary><pre className="raw-json-preview">{JSON.stringify(row.rawJson,null,2)}</pre></details></ReviewSection>
    </ReviewWorkflow></div>;
}
