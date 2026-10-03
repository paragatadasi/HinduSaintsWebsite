"use client";
import {useState} from "react";
import type {MuseumSaintPlacement} from "@/lib/museum-proposals";
import type {ArrangementStatus} from "@/lib/museum-arrangement-domain";
import {MuseumActionForm} from "@/components/admin/museum-action-form";
import {saveArrangementAction} from "@/app/museumadmin/arrangement-actions";
export function MuseumArrangementEditor({row}:{row:MuseumSaintPlacement}) {
 const current=row.arrangement;const [status,setStatus]=useState<ArrangementStatus>(current?.status||"Proposed");
 if(!current||!row.saintId||row.placementState?.startsWith("Conflicting"))return null;
 return <details className="museum-saint-review-section"><summary>Update arrangement</summary>
 <MuseumActionForm action={saveArrangementAction}>
  <input type="hidden" name="placementId" value={row.id}/><input type="hidden" name="revision" value={current.revision}/><input type="hidden" name="familyKey" value={current.familyKey}/>
  <label>Arrangement status<select name="status" value={status} onChange={e=>setStatus(e.target.value as ArrangementStatus)}><option>Proposed</option><option>Planned</option><option>Implemented</option></select></label>
  <p>{status==="Proposed"?"This proposal is open to change; no separate approval is needed.":status==="Planned"?"Record the destination vitrine. You can choose the shelf later.":"Confirm that the latest proposed arrangement has been physically implemented."}</p>
  {status!=="Proposed"?<div className="admin-form-grid"><label>{status==="Planned"?"Destination vitrine (required)":"Implemented vitrine (optional)"}<input name="vitrine" required={status==="Planned"} maxLength={100} defaultValue={current.vitrine}/></label><label>Shelf (optional)<input name="shelf" maxLength={100} defaultValue={current.shelf}/></label></div>:null}
  {status==="Implemented"?<><label><input type="checkbox" name="physicalConfirmation" value="yes" required/> I have checked that this arrangement is physically implemented.</label><label><input type="checkbox" name="inventoryAcknowledged" value="yes" required/> I understand that relic inventory completeness has not been verified.</label><p>This records your confirmation. Individual relic locations are updated in their own records, including any relics displayed separately.</p></>:null}
  <div className="review-actions"><button type="submit" className="museum-admin-button">Save arrangement</button></div>
 </MuseumActionForm></details>;
}
