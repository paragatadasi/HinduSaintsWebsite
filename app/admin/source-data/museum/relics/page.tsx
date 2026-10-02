import type { Route } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/admin-access";
import { hasCapability } from "@/lib/permissions";
import { collectionObservationSchema } from "@/lib/museum-collection-domain";
import { ReviewWorkflow, ReviewFactGrid } from "@/components/admin/review-ui";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { syncRelics, reviewRelic } from "./actions";
export default async function RelicReview({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const user=await requireCapability("view_source_data"); const params=await searchParams;
  const canReview=hasCapability(user.roles,"manage_museum");
  const [observations,items,saints]=await Promise.all([
    db.museumCollectionImport.findMany({where:{museumId:"museum-spn",sourceKey:{startsWith:"appMapiXrtNwnS9oZ:Relics:"}},distinct:["sourceKey"],orderBy:[{sourceKey:"asc"},{observedAt:"desc"},{id:"desc"}]}),
    db.museumCollectionItem.findMany({where:{catalogMuseumId:"museum-spn",status:{not:"archived"}},include:{placements:{where:{endedAt:null},include:{location:true}},saints:true},orderBy:{label:"asc"}}),
    db.saint.findMany({where:{status:{not:"archived"}},select:{id:true,displayName:true}})
  ]);
  const status=["deferred","completed"].includes(params.status||"")?params.status:"pending";
  const q=(params.q||"").trim().toLowerCase().slice(0,200);
  const filtered=observations.filter(r=>(status==="completed"?["accepted","kept","imported"].includes(r.status):r.status===status) && (!q||JSON.stringify(r.normalizedJson).toLowerCase().includes(q)));
  const page=Math.max(1,parseInt(params.page||"1")||1); const visible=filtered.slice((page-1)*20,page*20);
  const decisions=await db.auditEvent.findMany({where:{entityType:"MuseumCollectionImport",entityId:{in:visible.map(r=>r.id)}},distinct:["entityId"],orderBy:[{entityId:"asc"},{createdAt:"desc"},{id:"desc"}]});
  const names=(ids:string[])=>ids.map(id=>saints.find(s=>s.id===id)?.displayName||"Unavailable saint").join("; ");
  return <div className="admin-stack">
    <h1>SPN relics and locations</h1><p><Link href="/admin/source-data/museum">Museum updates</Link></p>
    <p>Connect existing museum relics using the current Website mirror. Clear saint links and locations become the initial inventory directly. Later differences stay here for review; existing item locations are preserved.</p>
    {canReview&&hasCapability(user.roles,"run_imports")?<form action={syncRelics}><button className="admin-form-button">Connect relics from current mirror</button></form>:null}
    <p>Refresh Museum updates first when Airtable has changed. This uses existing website saints and never creates new saint drafts. Each Relics row represents one item; saint description text is not split into invented objects.</p>
    {params.imported?<p role="status">Connected {Number(params.imported)||0} new relics; {Number(params.pending)||0} rows need review.</p>:null}
    {params.saved?<p role="status">Decision saved.</p>:null}
    {params.error?<p role="alert">The source or item changed, a required field is missing, or the operation could not complete. Connect the latest mirror, then review again. No partial changes were saved.</p>:null}
    <nav aria-label="Relic review status"><Link href={"/admin/source-data/museum/relics" as Route}>Needs review</Link> &middot; <Link href={"/admin/source-data/museum/relics?status=deferred" as Route}>Deferred</Link> &middot; <Link href={"/admin/source-data/museum/relics?status=completed" as Route}>Connected / resolved</Link></nav>
    <form className="admin-search"><input type="hidden" name="status" value={status}/><label>Find relic<input name="q" defaultValue={q}/></label><button className="admin-form-button">Search</button></form>
    <p>{filtered.length} rows &middot; Page {page}</p>
    {visible.map(row=>{
      const parsed=collectionObservationSchema.safeParse(row.normalizedJson); if(!parsed.success) return null; const source=parsed.data;
      const item=items.find(i=>i.id===row.itemId); const current=item?.placements[0]?.location;
      const evidence=(row.rawJson as {evidence?:{recordId:string;name:unknown;vitrine:unknown;shelf:unknown;saintId:string|null}[]}).evidence||[];
      const decision=decisions.find(d=>d.entityId===row.id)?.afterJson as {note?:string}|undefined;
      const unresolved=!source.saintIds.length||evidence.some(e=>!e.saintId);
      const [vitrine,shelf]=(source.location?.code||"").split("/");
      return <ReviewWorkflow key={row.id} eyebrow={row.status} title={source.label} description={item?"Compare the current item with the latest source evidence.":"This source could not be connected automatically."}>
        <ReviewFactGrid facts={[{label:"Website item",value:item?.label||"Not connected"},{label:"Current location",value:current?current.label:"Unknown"},{label:"Current saints",value:item?names(item.saints.map(s=>s.saintId)):"None"},{label:"Source saints",value:names(source.saintIds)||"Unresolved"},{label:"Source location",value:source.location?.label||"Missing or inconsistent"}]}/>
        {decision?.note?<p>Last decision: {decision.note}</p>:null}
        <p>Source: {row.sourceKey} &middot; Observed {row.observedAt.toISOString()}</p>
        {unresolved?<p>Resolve source saint links in <Link href="/admin/source-data/museum">Museum updates</Link>, then connect relics again.</p>:null}
        <details><summary>Linked source rows</summary><ul>{evidence.map(e=><li key={e.recordId}>{typeof e.name==="string"?e.name:e.recordId}: vitrine {String(e.vitrine??"unknown")}, shelf {String(e.shelf??"unknown")}</li>)}</ul></details>
        {canReview?<form action={reviewRelic} className="admin-stack">
          <input type="hidden" name="id" value={row.id}/><input type="hidden" name="version" value={`${row.status}:${row.reviewedAt?.toISOString()||""}`}/>
          {item?<input type="hidden" name="item" value={`${item.id}:${item.version}`}/>:<SearchableSelect name="item" label="Same physical item already exists? Select it; otherwise leave blank." options={items.map(i=>({value:`${i.id}:${i.version}`,label:i.label,description:i.inventoryCode||i.id}))}/>}
          {status!=="completed"?<>
            <label>Item name<input name="label" defaultValue={source.label} maxLength={500}/></label>
            <label>Vitrine<input name="vitrine" defaultValue={vitrine} inputMode="numeric" pattern="[1-9][0-9]{0,5}"/></label>
            <label>Shelf<input name="shelf" defaultValue={shelf||""} maxLength={8}/></label>
            <label><input type="checkbox" name="unknown"/> Confirm location is unknown (leave vitrine and shelf empty)</label>
            <label><input type="checkbox" name="confirm"/> I confirm this is one physical item, with the listed source saints and this SPN location. Existing item associations are retained.</label>
          </>:null}
          <label>Decision note<textarea name="note" required maxLength={2000}/></label>
          <div className="review-actions">{status!=="completed"?<><button name="action" value="accept" disabled={unresolved} className="admin-form-button">Save confirmed item and location</button>{item?<button name="action" value="keep" className="admin-form-button">Keep website item unchanged</button>:null}<button name="action" value="defer" className="admin-form-button">Defer</button></>:<button name="action" value="reopen" className="admin-form-button">Reopen review</button>}</div>
        </form>:null}
      </ReviewWorkflow>;
    })}
    <nav aria-label="Relic pages">{page>1?<Link href={`/admin/source-data/museum/relics?status=${status}&q=${encodeURIComponent(q)}&page=${page-1}` as Route}>Previous</Link>:null} {page*20<filtered.length?<Link href={`/admin/source-data/museum/relics?status=${status}&q=${encodeURIComponent(q)}&page=${page+1}` as Route}>Next</Link>:null}</nav>
  </div>;
}
