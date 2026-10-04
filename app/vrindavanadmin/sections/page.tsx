import Link from "next/link";
import {notFound} from "next/navigation";
import {Search} from "lucide-react";
import {requireCapability} from "@/lib/admin-access";
import {getVrindavanWorkspaceData as readVrindavanWorkingData} from "@/lib/vrindavan-workspace-data";
import {hasCapability} from "@/lib/permissions";
import {MuseumInventoryUnavailableError} from "@/lib/vrindavan-museum-inventory";
import {readMuseumSaintProfiles} from "@/lib/museum-saint-profiles";
import {MuseumSearchResults} from "@/components/admin/museum-search-results";
import {MuseumProposalOverview} from "@/components/admin/museum-proposal-overview";
import {MuseumSectionWorkspace} from "@/components/admin/museum-section-workspace";
import {buildMuseumView,type MuseumSection} from "@/lib/museum-proposals";
import {searchWorkingMuseumPlacements} from "@/lib/museum-working-view";

export default async function VrindavanSections({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 const user=await requireCapability("access_museum");await requireCapability("view_full_saint_catalog");
 const params=await searchParams;
 const value=(key:string)=>typeof params[key]==="string"?params[key].trim().slice(0,200):"";
 const query=value("q"),sectionSlug=value("section");
 let data:Awaited<ReturnType<typeof readVrindavanWorkingData>>;
 try{data=await readVrindavanWorkingData();}catch(error){if(error instanceof MuseumInventoryUnavailableError)return <div className="admin-stack"><h1>Section proposals</h1><p>Vrindavan inventory is not available yet.</p></div>;throw error;}
 const {placements,sections:catalogue,audit,families,groupOptions}=data;
 const canManage=hasCapability(user.roles,"manage_museum"),canEditRelationships=hasCapability(user.roles,"edit_structured_content");
 const view=buildMuseumView(placements,new Map(),new Map(groupOptions.map(g=>[g.key,g.label])),new Map(),new Set(placements.filter(p=>p.needsResearch).map(p=>p.id)));
 // Keep empty destinations navigable after the final member is moved elsewhere.
 const sections:MuseumSection[]=catalogue.map(item=>({... (view.sections.find(s=>s.name===item.name)||{name:item.name,idea:"Section idea pending curator review.",total:0,featured:0,secondary:0,tertiary:0,confidence:{high:0,medium:0,low:0},rows:[],families:[],primaryGroups:[],secondaryOnlyGroups:[],secondaryUngrouped:[],tertiaryGroups:[],tertiaryUngrouped:[],geography:[],health:[]}),slug:item.slug}));
 const section=sections.find(s=>s.slug===sectionSlug);
 if(sectionSlug&&!section)notFound();
 const editing={sections:catalogue.filter(s=>s.slug!=="needs-section-proposal").map(s=>s.name),groups:groupOptions};
 const matches=query?searchWorkingMuseumPlacements(placements,query,30):[];
 const profiles=await readMuseumSaintProfiles((section?.rows||matches).flatMap(p=>p.saintId?[p.saintId]:[]));
 const notices=<>{value("saved")?<p role="status">Vrindavan arrangement updated.</p>:null}{value("correctionRequested")?<p role="status">Relationship correction requested.</p>:null}</>;
 if(section)return <>{notices}<MuseumSectionWorkspace key={section.slug} section={section} overviewHref="/vrindavanadmin/sections" memberDetails={{}} saintProfiles={profiles} familyMoveOptions={families} sectionNames={editing.sections} vrindavanEditing={editing} canManage={canManage} canEditRelationships={canEditRelationships}/></>;
 return <div className="museum-admin museum-admin--index">
  {notices}
  <MuseumProposalOverview museumName="Vrindavan Museum" sections={sections} basePath="/vrindavanadmin/sections" queryLinks showBridges={false}>
   <section className="museum-admin-panel">
    <div className="museum-admin-section-heading"><div><div className="museum-admin-kicker">Find a saint</div><h2>Search section assignment</h2></div></div>
    <form action="/vrindavanadmin/sections" className="museum-admin-search" role="search">
     <label className="sr-only" htmlFor="museum-search">Search by saint name</label><Search aria-hidden="true" size={18}/>
     <input id="museum-search" name="q" defaultValue={query} placeholder="Search a saint, deity, family member, place, or section" type="search"/>
     <button className="museum-admin-button" type="submit">Search</button>
     {query?<Link className="museum-admin-button museum-admin-button--secondary" href="/vrindavanadmin/sections">Clear</Link>:null}
    </form>
    {query?<MuseumSearchResults key={query} matches={matches} profiles={profiles} members={{}} sections={sections} familyMoveOptions={families} canManage={canManage} canEditRelationships={canEditRelationships} vrindavanEditing={editing} readOnly sectionBasePath="/vrindavanadmin/sections" inventoryBasePath="/vrindavanadmin"/>:null}
   </section>
  </MuseumProposalOverview>
  <details className="museum-admin-panel"><summary>Proposal coverage and source notes</summary><p>{audit.summary.saints} linked saints. {audit.summary.needsSectionReview} need a section proposal or have competing source proposals. Display families begin as suggestions adapted from SPN. Vrindavan edits are stored separately and do not change SPN or historical relationships. Source inventory is not a verified physical layout.</p></details>
 </div>;
}
