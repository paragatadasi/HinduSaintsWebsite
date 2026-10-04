import Link from "next/link";
import type {Route} from "next";
import type {ReactNode} from "react";
import {auth,isEmailAuthConfigured,isGoogleAuthConfigured} from "@/lib/auth";
import {requireCapability} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {AdminSignIn} from "@/components/admin/admin-sign-in";

// Shared private shell; navigation readers run only after museum access is checked.
export async function MuseumWorkspace({name,subtitle,homeHref,loadNavigation,children}:{name:string;subtitle:string;homeHref:string;loadNavigation:(canViewSections:boolean)=>Promise<ReactNode>;children:ReactNode}) {
 const session=await auth();
 if(!session?.user?.email) return <AdminSignIn emailConfigured={isEmailAuthConfigured} googleConfigured={isGoogleAuthConfigured} configurationDescription="Authentication must be configured before the museum admin can sign in approved users." description="Use your approved team email to access the museum workspace." redirectTo={homeHref} workspaceLabel={name} workspaceSubtitle={subtitle}/>;
 const user=await requireCapability("access_museum");
 const navigation=await loadNavigation(hasCapability(user.roles,"view_full_saint_catalog"));
 return <main className="museum-admin-shell" data-theme="nocturne"><div className="museum-admin-layout">
  <aside className="museum-admin-nav"><Link className="museum-admin-nav__home" href={homeHref as Route}><strong>{name}</strong><span>{subtitle}</span></Link>{navigation}</aside>
  <section className="museum-admin-content">{children}</section>
 </div></main>;
}
