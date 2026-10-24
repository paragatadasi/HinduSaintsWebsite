import Link from "next/link";
import type {Route} from "next";
import {requireCapability} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {spnMuseumLayout} from "@/lib/spn-museum-layout";
import {readSpnLayoutInventory} from "@/lib/spn-layout-inventory";
import {MuseumLayoutWorkspace} from "@/components/admin/museum-layout-workspace";
import {MuseumVitrineRecords} from "@/components/admin/museum-vitrine-records";
import {MuseumQuestionnaire} from "@/components/admin/museum-questionnaire";
import {readSpnCuratorQuestions} from "@/lib/spn-curator-questionnaire";
import {museumOverviewHref,type MuseumOverviewParams} from "@/lib/museum-overview";
import {loadSpnQuestionsAction,saveSpnAnswerAction,loadSpnCandidateAction} from "../plan/actions";

export default async function MuseumOverview({searchParams}:{searchParams:Promise<MuseumOverviewParams>}) {
 const user=await requireCapability("access_museum");
 const params=await searchParams;
 const canViewLayout=hasCapability(user.roles,"view_full_saint_catalog");
 const records=params.view==="records"||!canViewLayout;
 return <div className="admin-stack">
  <header className="museum-layout-header"><div><p className="eyebrow">SPN museum</p><h1>Museum Overview</h1><p>Explore the room and find the saints and relics recorded in each vitrine.</p></div><dl className="museum-layout-stats"><div><dt>Available now</dt><dd>{spnMuseumLayout.vitrines.filter(v=>v.availability!=="future").length}</dd></div><div><dt>Including new</dt><dd>{spnMuseumLayout.vitrines.filter(v=>v.availability==="new").length}</dd></div><div><dt>Future spaces</dt><dd>{spnMuseumLayout.vitrines.filter(v=>v.availability==="future").length}</dd></div></dl></header>
  <nav className="museum-layout-nav" aria-label="Museum Overview views">
   {canViewLayout?<Link href={museumOverviewHref(params) as Route} prefetch={false} aria-current={!records?"page":undefined}>Layout</Link>:null}
   <Link href={museumOverviewHref(params,"records") as Route} prefetch={false} aria-current={records?"page":undefined}>Vitrine records</Link>
  </nav>
  {records?<MuseumVitrineRecords searchParams={Promise.resolve(params)}/>:<OverviewLayout vitrine={typeof params.vitrine==="string"?params.vitrine:""} canEdit={hasCapability(user.roles,"manage_museum")}/>}
 </div>;
}
async function OverviewLayout({vitrine,canEdit}:{vitrine:string;canEdit:boolean}) {
 const [inventory,questions]=await Promise.all([readSpnLayoutInventory(),readSpnCuratorQuestions()]);
 return <><MuseumLayoutWorkspace key={vitrine} layout={spnMuseumLayout} {...inventory} initialVitrine={vitrine}/><MuseumQuestionnaire initial={questions} canEdit={canEdit} actions={{load:loadSpnQuestionsAction,save:saveSpnAnswerAction,profile:loadSpnCandidateAction}}/></>;
}
