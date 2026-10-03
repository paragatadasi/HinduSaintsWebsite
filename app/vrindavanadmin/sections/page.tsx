import Link from "next/link";
import type {Route} from "next";
import {requireCapability} from "@/lib/admin-access";
import {readVrindavanSectionProposalAudit} from "@/lib/vrindavan-section-proposals";
import {MuseumInventoryUnavailableError} from "@/lib/vrindavan-museum-inventory";
import {vrindavanSectionView} from "@/lib/vrindavan-section-view";
import {readMuseumSaintProfiles} from "@/lib/museum-saint-profiles";
import {MuseumSearchResults} from "@/components/admin/museum-search-results";
import {MuseumInventoryFilters} from "@/components/admin/museum-inventory-filters";
export default async function VrindavanSections({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 await requireCapability("access_museum");await requireCapability("view_full_saint_catalog");
 const params=await searchParams;const value=(key:string)=>typeof params[key]==="string"?params[key].trim().slice(0,200):"";
 const query=value("q"),sectionSlug=value("section");
 let audit:Awaited<ReturnType<typeof readVrindavanSectionProposalAudit>>;
 try{audit=await readVrindavanSectionProposalAudit();}catch(error){if(error instanceof MuseumInventoryUnavailableError)return <div className="admin-stack"><h1>Section proposals</h1><p>Vrindavan inventory is not available yet.</p></div>;throw error;}
 const {placements,sections}=vrindavanSectionView(audit);const section=sections.find(s=>s.slug===sectionSlug);
 const matches=placements.filter(p=>(!sectionSlug||p.section===section?.name)&&(!query||[p.name,p.section,...p.normalizedPlaces,...p.spiritualRegions].some(s=>s.toLocaleLowerCase().includes(query.toLocaleLowerCase()))));
 const page=Math.max(1,Math.min(Math.max(1,Math.ceil(matches.length/30)),parseInt(value("page"),10)||1));const visible=matches.slice((page-1)*30,page*30);
 const profiles=await readMuseumSaintProfiles(visible.flatMap(p=>p.saintId?[p.saintId]:[]));
 const href=(next:number)=>`/vrindavanadmin/sections?${new URLSearchParams({section:sectionSlug,q:query,page:String(next)})}` as Route;
 return <div className="museum-admin admin-stack">
  <header><div className="eyebrow">Vrindavan Museum</div><h1>{section?.name||"Section proposals"}</h1><p>Explore a starting arrangement for the saints in the reviewed Vrindavan inventory. Open a saint for photographs, biography and proposal details.</p></header>
  <p>Proposals are adapted from SPN with reviewed lineage corrections. This view is for discussion; it does not record physical moves.</p>
  <MuseumInventoryFilters action="/vrindavanadmin/sections" query={query} searchLabel="Saint, place or section" submitLabel="Find saints" filters={[{name:"section",label:"Proposed section",value:sectionSlug,allLabel:"All sections",options:sections.map(s=>({value:s.slug,label:`${s.name} (${s.count})`}))}]}/>
  {!sectionSlug&&!query?<div className="museum-search-results__grid">{sections.map(s=><Link key={s.slug} className="museum-search-result interactive-surface" href={`/vrindavanadmin/sections?section=${encodeURIComponent(s.slug)}` as Route}><strong>{s.name}</strong><span>{s.count} saint proposal{s.count===1?"":"s"}</span></Link>)}</div>:null}
  <p role="status">{matches.length} saint proposal{matches.length===1?"":"s"}{section?` in ${section.name}`:""}</p>
  <MuseumSearchResults key={`${sectionSlug}:${query}:${page}`} matches={visible} profiles={profiles} members={{}} sections={sections} familyMoveOptions={[]} canManage={false} readOnly sectionBasePath="/vrindavanadmin/sections" inventoryBasePath="/vrindavanadmin"/>
  {matches.length>30?<nav className="review-actions" aria-label="Proposal pages">{page>1?<Link href={href(page-1)}>Previous</Link>:null}<span>Page {page} of {Math.ceil(matches.length/30)}</span>{page*30<matches.length?<Link href={href(page+1)}>Next</Link>:null}</nav>:null}
  <details><summary>Proposal coverage and source notes</summary><p>{audit.summary.saints} linked saints. {audit.summary.needsSectionReview} need a section proposal or have competing source proposals. Missing proposals appear under “Needs section proposal.” Multiple candidates remain visible for discussion. Museum-specific grouping and editing will follow separately.</p></details>
 </div>;
}
