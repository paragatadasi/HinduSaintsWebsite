"use client";
import {useState} from "react";
import {SectionDestinationPreview,useSectionDestinationPreview} from "./section-destination-preview";
import type {MuseumSaintPlacement} from "@/lib/museum-proposals";
import {MuseumActionForm} from "./museum-action-form";
import {MuseumArrangementEditor} from "./museum-arrangement-editor";
import {MuseumDisplayMembershipEditor} from "./museum-display-membership-editor";
import {SearchableSelect} from "@/components/ui/searchable-select";
import {saveVrindavanProposalAction,saveVrindavanArrangementAction,requestVrindavanRelationshipCorrectionAction} from "@/app/vrindavanadmin/actions";
export type VrindavanEditingOptions={sections:string[];groups:{key:string;label:string}[]};
export function VrindavanProposalControls({row,options,canEditRelationships=false}:{row:MuseumSaintPlacement;options:VrindavanEditingOptions;canEditRelationships?:boolean}) {
 return <><details className="museum-saint-review-section"><summary>Edit tier, section or display family</summary>
 <p>Changes apply to Vrindavan. Choose “No display family” to remove this saint from the display group while retaining historical relationships. Re-select the family to restore membership.</p>
 <VrindavanProposalEditor row={row} options={options}/></details>
 <MuseumArrangementEditor row={row} action={saveVrindavanArrangementAction}/>
 <MuseumDisplayMembershipEditor row={row} canEditRelationships={canEditRelationships} correctionAction={requestVrindavanRelationshipCorrectionAction}/>
 </>;
}

export function VrindavanProposalEditor({row,options,action=saveVrindavanProposalAction}:{row:MuseumSaintPlacement;options:VrindavanEditingOptions;action?:(form:FormData)=>Promise<{error:string}>}) {
 const [section,setSection]=useState(row.section==="Needs section proposal"?"":row.section);
 const [groupKey,setGroupKey]=useState(row.familyId||"");
 const preview=useSectionDestinationPreview(section&&section!==row.section?{saintId:row.saintId,section,groupKey}:null);
 return <>
 <MuseumActionForm action={async form=>preview.ready?action(form):{error:"Review the destination preview before saving."}}>
 <input type="hidden" name="saintId" value={row.saintId}/><input type="hidden" name="revision" value={row.curatorProposalRevision}/>
 <label>Display tier<select name="tier" defaultValue={row.tier}><option value="Featured">Primary</option><option>Secondary</option><option>Tertiary</option></select></label>
 <SearchableSelect name="groupKey" onValueChange={setGroupKey} label="Display family" defaultValue={row.familyId} options={[{value:"",label:"No display family"},...options.groups.map(g=>({value:g.key,label:g.label}))]}/>
 <SearchableSelect name="section" onValueChange={setSection} label="Section" required defaultValue={row.section==="Needs section proposal"?"":row.section} options={options.sections.map(value=>({value,label:value}))}/>
 <SectionDestinationPreview preview={preview}/>
 <div className="review-actions"><button className="museum-admin-button" type="submit" disabled={!preview.ready}>Save proposal</button></div>
 </MuseumActionForm>
 </>;
}
