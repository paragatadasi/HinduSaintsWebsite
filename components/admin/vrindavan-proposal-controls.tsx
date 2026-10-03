"use client";
import type {MuseumSaintPlacement} from "@/lib/museum-proposals";
import {MuseumActionForm} from "./museum-action-form";
import {MuseumArrangementEditor} from "./museum-arrangement-editor";
import {MuseumDisplayMembershipEditor} from "./museum-display-membership-editor";
import {SearchableSelect} from "@/components/ui/searchable-select";
import {saveVrindavanProposalAction,saveVrindavanArrangementAction,requestVrindavanRelationshipCorrectionAction} from "@/app/vrindavanadmin/actions";
export type VrindavanEditingOptions={sections:string[];groups:{key:string;label:string}[]};
export function VrindavanProposalControls({row,options,canEditRelationships=false}:{row:MuseumSaintPlacement;options:VrindavanEditingOptions;canEditRelationships?:boolean}) {
 return <><details className="museum-saint-review-section"><summary>Edit section or display family</summary>
 <p>Changes apply to Vrindavan. Choose “No display family” to remove this saint from the display group while retaining historical relationships. Re-select the family to restore membership.</p>
 <MuseumActionForm action={saveVrindavanProposalAction}>
 <input type="hidden" name="saintId" value={row.saintId}/><input type="hidden" name="revision" value={row.curatorProposalRevision}/>
 <SearchableSelect name="section" label="Section" required defaultValue={row.section==="Needs section proposal"?"":row.section} options={options.sections.map(value=>({value,label:value}))}/>
 <label>Display tier<select name="tier" defaultValue={row.tier}><option>Featured</option><option>Secondary</option><option>Tertiary</option></select></label>
 <SearchableSelect name="groupKey" label="Display family" defaultValue={row.familyId} options={[{value:"",label:"No display family"},...options.groups.map(g=>({value:g.key,label:g.label}))]}/>
 <div className="review-actions"><button className="museum-admin-button" type="submit">Save proposal</button></div>
 </MuseumActionForm></details>
 <MuseumArrangementEditor row={row} action={saveVrindavanArrangementAction}/>
 <MuseumDisplayMembershipEditor row={row} canEditRelationships={canEditRelationships} correctionAction={requestVrindavanRelationshipCorrectionAction}/>
 </>;
}
