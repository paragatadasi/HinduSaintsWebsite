import Link from "next/link";
import type {Metadata,Route} from "next";
import {MuseumWorkspace} from "@/components/admin/museum-workspace";
export const dynamic="force-dynamic";
export const metadata:Metadata={robots:{index:false,follow:false}};
export default function VrindavanAdminLayout({children}:{children:React.ReactNode}) {
 return <MuseumWorkspace name="Vrindavan Museum" subtitle="Inventory and locations" homeHref="/vrindavanadmin" loadNavigation={navigation}>{children}</MuseumWorkspace>;
}
async function navigation() {
 return <nav className="museum-admin-nav__group-links" aria-label="Vrindavan museum"><Link href={"/vrindavanadmin" as Route}>Browse inventory</Link><Link href="/admin">Main admin</Link></nav>;
}
