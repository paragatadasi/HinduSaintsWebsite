import type {ReactNode} from "react";
import {isEmailAuthConfigured,isGoogleAuthConfigured,signOut} from "@/lib/auth";
import {getAdminUser,requireCapability} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {AdminSignIn} from "@/components/admin/admin-sign-in";
import {MuseumWorkspaceLayout} from "@/components/admin/museum-workspace-layout";

// Shared private shell; navigation readers run only after museum access is checked.
export async function MuseumWorkspace({name,subtitle,homeHref,loadNavigation,children}:{name:string;subtitle:string;homeHref:string;loadNavigation:(canViewSections:boolean,canAccessMainAdmin:boolean)=>Promise<ReactNode>;children:ReactNode}) {
 const signedIn=await getAdminUser();
 if(!signedIn?.active) return <AdminSignIn emailConfigured={isEmailAuthConfigured} googleConfigured={isGoogleAuthConfigured} configurationDescription="Authentication must be configured before the museum admin can sign in approved users." description="Use your team account to access the museum workspace." redirectTo={homeHref} workspaceLabel={name} workspaceSubtitle={subtitle}/>;
 const user=await requireCapability("access_museum");
 const navigation=await loadNavigation(hasCapability(user.roles,"view_museum_catalog"),user.roles.some(role=>role!=="museum_assistant"));
 return <main className="museum-admin-shell" data-theme="nocturne"><MuseumWorkspaceLayout navigation={<>{navigation}<form action={async()=>{"use server";await signOut({redirectTo:"/museumadmin/overview"});}}><button className="museum-admin-button museum-admin-button--secondary" type="submit">Sign out</button></form></>}>
  {children}
 </MuseumWorkspaceLayout></main>;
}
