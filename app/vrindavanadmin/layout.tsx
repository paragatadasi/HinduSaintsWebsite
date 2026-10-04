import {Suspense} from "react";
import type {Metadata} from "next";
import {MuseumWorkspace} from "@/components/admin/museum-workspace";
import {MuseumNavigation} from "@/components/admin/museum-navigation";
import {getVrindavanWorkspaceData} from "@/lib/vrindavan-workspace-data";
import {MuseumInventoryUnavailableError} from "@/lib/vrindavan-museum-inventory";
import type {MuseumNavSection} from "@/lib/museum-navigation";
export const dynamic="force-dynamic";
export const metadata:Metadata={robots:{index:false,follow:false}};
export default function VrindavanAdminLayout({children}:{children:React.ReactNode}) {
 return <MuseumWorkspace name="Vrindavan Museum" subtitle="Sections, inventory and locations" homeHref="/vrindavanadmin" loadNavigation={navigation}>{children}</MuseumWorkspace>;
}
async function navigation(canViewSections:boolean) {
 let sections:MuseumNavSection[]=[],unavailable=false;
 if(canViewSections)try{sections=(await getVrindavanWorkspaceData()).sections.map(({name,slug,count})=>({name,slug,total:count}));}catch(error){if(error instanceof MuseumInventoryUnavailableError)unavailable=true;else throw error;}
 return <Suspense fallback={<p>Loading navigation…</p>}><MuseumNavigation museum="vrindavan" sections={sections} canViewSections={canViewSections} sectionsUnavailable={unavailable}/></Suspense>;
}
