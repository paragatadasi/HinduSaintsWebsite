"use client";
import Link from "next/link";
import type {Route} from "next";
import type {MuseumSaintPlacement} from "@/lib/museum-proposals";
import {MuseumActionForm} from "@/components/admin/museum-action-form";
import {changeDisplayMembershipAction,requestRelationshipCorrectionAction} from "@/app/museumadmin/membership-actions";
export function MuseumDisplayMembershipEditor({row,canEditRelationships=false}:{row:MuseumSaintPlacement;canEditRelationships?:boolean}) {
 const membership=row.displayMembership;
 return <>
  {membership?<details className="museum-saint-review-section"><summary>Display group membership</summary>
   <p>{membership.detached?`Removed from ${membership.label}.`:`Displayed with ${membership.label}.`}</p>
   <p>{membership.detached?"Restoring membership rejoins the family's current proposed section. Relic locations remain unchanged.":"Remove this saint from the display group while keeping the current section and relic locations. Future family moves will exclude this saint. Historical relationships remain unchanged."}</p>
   <MuseumActionForm action={changeDisplayMembershipAction}><input type="hidden" name="placementId" value={row.id}/><input type="hidden" name="familyKey" value={membership.familyKey}/><input type="hidden" name="revision" value={membership.revision}/><input type="hidden" name="action" value={membership.detached?"restore":"detach"}/><div className="review-actions"><button className="museum-admin-button" type="submit">{membership.detached?"Restore display membership":"Remove from display group"}</button></div></MuseumActionForm>
  </details>:null}
  {row.saintId?<details className="museum-saint-review-section"><summary>Correct a historical relationship</summary>
   <p>Use this when the recorded relationship itself is wrong. A relationship correction is separate from museum display membership.</p>
   {canEditRelationships&&row.adminSaintSlug?<p><Link href={`/admin/saints/${row.adminSaintSlug}/summary#saint-relationships` as Route}>Open the relationship editor</Link></p>:null}
   <MuseumActionForm action={requestRelationshipCorrectionAction}><input type="hidden" name="saintId" value={row.saintId}/><label>What needs correcting?<textarea name="note" required minLength={10} maxLength={2000} placeholder="Describe the mistaken relationship and the evidence or correction."/></label><div className="review-actions"><button className="museum-admin-button" type="submit">Request relationship correction</button></div><p>The editorial team can review this request in the reconciliation queue.</p></MuseumActionForm>
  </details>:null}
 </>;
}
