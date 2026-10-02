import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/admin-access";
import { hasCapability } from "@/lib/permissions";
import { ReviewWorkflow, ReviewFactGrid, ReviewSection } from "@/components/admin/review-ui";
import { proposeMove, finishMove } from "./actions";
export default async function ItemMoves({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{error?:string;saved?:string}>}) {
  const user=await requireCapability("access_museum");const {id}=await params;const query=await searchParams;
  const item=await db.museumCollectionItem.findFirst({where:{id,catalogMuseumId:"museum-spn",status:{not:"archived"},catalogMuseum:{archivedAt:null}},include:{saints:{include:{saint:{select:{id:true,displayName:true}}}},placements:{include:{location:{include:{museum:true}}},orderBy:[{startedAt:"desc"},{id:"desc"}]},movePlans:{include:{fromLocation:true,targetLocation:true},orderBy:[{createdAt:"desc"},{id:"desc"}]}}});
  if(!item) notFound();const current=item.placements.find(p=>!p.endedAt);const plan=item.movePlans.find(p=>p.status==="planned");const canEdit=hasCapability(user.roles,"manage_museum");
  const stale=plan&&(plan.expectedItemVersion!==item.version||plan.fromLocationId!==(current?.locationId??null)||plan.targetLocation.archivedAt);
  return <div className="admin-stack"><p><Link href={"/museumadmin/collections" as Route}>All relics</Link></p><h1>{item.label}</h1>
    {query.error?<p role="alert">The item or plan changed, or the destination is invalid. Reload and review the current location; cancel an outdated plan before proposing another.</p>:null}
    {query.saved?<p role="status">Saved. Only a confirmed physical move changes the current location.</p>:null}
    <ReviewWorkflow eyebrow="Physical location" title={current?current.location.museum.name+": "+current.location.label:"Location unknown"} description="Plans are separate from the museum's current inventory.">
      <ReviewFactGrid facts={[{label:"Item",value:item.label},{label:"Associated saints",value:item.saints.map(s=>s.saint.displayName).join("; ")||"None"}]}/>
      {plan?<ReviewSection title="Planned move"><p>From {plan.fromLocation?.label||"unknown location"} to {plan.targetLocation.label}</p><p>{plan.reason}</p>
        {stale?<p role="alert">The item or destination has changed since this plan was made. Cancel it and create a new plan from the current state.</p>:null}
        {canEdit?<form action={finishMove} className="form-stack"><input type="hidden" name="itemId" value={item.id}/><input type="hidden" name="planId" value={plan.id}/>
          <label>Completion or cancellation note<textarea name="note" required maxLength={2000}/></label>
          {!stale?<label className="admin-option-toggle admin-option-toggle--inline"><input type="checkbox" name="confirm"/> I confirm the physical item has moved to {plan.targetLocation.label}.</label>:null}
          <div className="review-actions">{!stale?<button name="action" value="complete" className="admin-form-button">Confirm physical move</button>:null}<button name="action" value="cancel" className="admin-form-button">Cancel plan</button></div>
        </form>:null}
      </ReviewSection>:canEdit?<ReviewSection title="Propose a move"><form action={proposeMove} className="form-stack">
        <input type="hidden" name="itemId" value={item.id}/><input type="hidden" name="version" value={item.version}/>
        <label>Destination SPN vitrine<input name="vitrine" required inputMode="numeric" pattern="[1-9][0-9]{0,5}"/></label><label>Shelf (optional)<input name="shelf" maxLength={8}/></label>
        <label>Reason for the move<textarea name="reason" required maxLength={2000}/></label><button className="admin-form-button">Save move proposal</button>
        <p>The item will remain at its current location until the physical move is confirmed.</p>
      </form></ReviewSection>:null}
    </ReviewWorkflow>
    <details><summary>Location history ({item.placements.length})</summary><ul>{item.placements.map(p=><li key={p.id}>{p.location.museum.name}: {p.location.label} &mdash; {p.startedAt.toISOString()} to {p.endedAt?.toISOString()||"present"}{p.note?<p>{p.note}</p>:null}</li>)}</ul></details>
    <details><summary>Move plan history ({item.movePlans.length})</summary><ul>{item.movePlans.map(p=><li key={p.id}>{p.status}: {p.fromLocation?.label||"Unknown"} → {p.targetLocation.label}<p>{p.reason}</p>{p.resolutionNote?<p>{p.resolutionNote}</p>:null}</li>)}</ul></details>
  </div>;
}
