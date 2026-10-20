"use client";

import {useId, useState, type ReactNode} from "react";
import {usePathname} from "next/navigation";
import {PanelLeftClose, PanelLeftOpen} from "lucide-react";

/** Keep the authenticated server navigation, while giving planners more room. */
export function MuseumWorkspaceLayout({navigation, children}: {navigation: ReactNode; children: ReactNode}) {
 const pathname = usePathname();
 return <WorkspaceLayout key={pathname} pathname={pathname} navigation={navigation}>{children}</WorkspaceLayout>;
}

function WorkspaceLayout({pathname, navigation, children}: {pathname: string; navigation: ReactNode; children: ReactNode}) {
 const navigationId = useId();
 const planning = /^\/(?:museumadmin|vrindavanadmin)\/plan(?:\/|$)/.test(pathname);
 const [opened, setOpened] = useState(false);
 const expanded = !planning || opened;
 const Icon = expanded ? PanelLeftClose : PanelLeftOpen;
 return <div className={`museum-admin-layout${expanded ? "" : " museum-admin-layout--focused"}`}>
  {planning ? <div className="museum-admin-layout__controls">
   <button type="button" className="museum-admin-button museum-admin-button--secondary" aria-controls={navigationId} aria-expanded={expanded}
    onClick={() => setOpened(!expanded)}>
    <Icon size={18} aria-hidden="true"/>{expanded ? "Hide navigation" : "Show navigation"}
   </button>
  </div> : null}
  <aside id={navigationId} className="museum-admin-nav" hidden={!expanded}>{navigation}</aside>
  <section className="museum-admin-content">{children}</section>
 </div>;
}
