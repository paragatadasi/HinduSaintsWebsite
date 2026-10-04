import {Suspense} from "react";
import type {Metadata} from "next";
import {getMuseumData} from "@/lib/museum-data";
import {MuseumWorkspace} from "@/components/admin/museum-workspace";
import {MuseumNavigation} from "@/components/admin/museum-navigation";
export const dynamic="force-dynamic";
export const metadata:Metadata={robots:{index:false,follow:false}};
export default function MuseumAdminLayout({children}:{children:React.ReactNode}) {
 return <MuseumWorkspace name="SPN Museum" subtitle="Shree Peetha Nilaya" homeHref="/museumadmin" loadNavigation={navigation}>{children}</MuseumWorkspace>;
}
async function navigation(canViewSections:boolean) {
 const sections=canViewSections?(await getMuseumData()).sections.map(({name,slug,total})=>({name,slug,total})):[];
 return <Suspense fallback={<p>Loading navigation…</p>}><MuseumNavigation museum="spn" sections={sections} canViewSections={canViewSections}/></Suspense>;
}
