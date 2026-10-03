"use client";
import {useState} from "react";
import type {MuseumSaintPlacement} from "@/lib/museum-proposals";
import type {ArrangementStatus,FamilyArrangementControl} from "@/lib/museum-arrangement-domain";
import {MuseumActionForm} from "@/components/admin/museum-action-form";
import {saveArrangementAction,saveFamilyArrangementAction} from "@/app/museumadmin/arrangement-actions";
export function MuseumArrangementEditor({row,action=saveArrangementAction}:{row:MuseumSaintPlacement;action?:(form:FormData)=>Promise<{error:string}>}) {
 const current=row.arrangement;
 if(!current||!row.saintId||row.placementState?.startsWith("Conflicting"))return null;
 return <details className="museum-saint-review-section"><summary>Update arrangement</summary>
 <MuseumActionForm action={action}>
  <input type="hidden" name="placementId" value={row.id}/><input type="hidden" name="revision" value={current.revision}/><input type="hidden" name="familyKey" value={current.familyKey}/>
  <ArrangementFields current={current}/>
  <div className="review-actions"><button type="submit" className="museum-admin-button">Save arrangement</button></div>
 </MuseumActionForm></details>;
}

export function MuseumFamilyArrangementEditor({familyKey,current,action=saveFamilyArrangementAction}:{familyKey:string;current:FamilyArrangementControl;action?:(form:FormData)=>Promise<{error:string}>}) {
 return <details className="museum-saint-review-section"><summary>Plan or record the whole family</summary>
 <p>{current.count} current display members · {current.status}. This applies the same destination and status to every listed member. Use individual saint cards for exceptions.</p>
 <details><summary>Included saints ({current.count})</summary><ul>{current.members.map(member=><li key={member.id}>{member.name} · {member.section}</li>)}</ul></details>
 {!current.eligible?<p>Resolve missing section proposals, saint links or competing placements before updating the whole family.</p>:<MuseumActionForm action={action}>
 <input type="hidden" name="familyKey" value={familyKey}/><input type="hidden" name="revision" value={current.revision}/>
 <ArrangementFields current={current}/><div className="review-actions"><button type="submit" className="museum-admin-button">Save family arrangement</button></div>
 </MuseumActionForm>}</details>;
}
function ArrangementFields({current}:{current:{status:ArrangementStatus|"Mixed";vitrine:string;shelf:string}}) {
 const [status,setStatus]=useState<ArrangementStatus|"">(current.status==="Mixed"?"":current.status);
 return <>
  <label>Arrangement status<select name="status" required value={status} onChange={e=>setStatus(e.target.value as ArrangementStatus)}><option value="" disabled>Choose status</option><option>Proposed</option><option>Planned</option><option>Implemented</option></select></label>
  <p>{!status?"Choose the status to apply to this family.":status==="Proposed"?"This proposal is open to change; no separate approval is needed.":status==="Planned"?"Record the destination vitrine. You can choose the shelf later.":"Confirm that the latest proposed arrangement has been physically implemented."}</p>
  {status&&status!=="Proposed"?<div className="admin-form-grid"><label>{status==="Planned"?"Destination vitrine (required)":"Implemented vitrine (optional)"}<input name="vitrine" required={status==="Planned"} maxLength={100} defaultValue={current.vitrine}/></label><label>Shelf (optional)<input name="shelf" maxLength={100} defaultValue={current.shelf}/></label></div>:null}
  {status==="Implemented"?<><label><input type="checkbox" name="physicalConfirmation" value="yes" required/> I have checked that this arrangement is physically implemented.</label><label><input type="checkbox" name="inventoryAcknowledged" value="yes" required/> I understand that relic inventory completeness has not been verified.</label><p>This records your confirmation. Individual relic locations are updated in their own records, including any relics displayed separately.</p></>:null}
 </>;
}
