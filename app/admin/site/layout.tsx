import type { ReactNode } from "react";
import { AdminWorkspaceTabs } from "@/components/admin/admin-navigation";
import { requireCapability } from "@/lib/admin-access";
import type { AdminNavigationGroup } from "@/lib/admin-navigation";

const siteConfigurationGroups: AdminNavigationGroup[] = [
  {
    href: "/admin/site",
    id: "site-configuration",
    label: "Site configuration",
    items: [
      { exact: true, href: "/admin/site", label: "Homepage" },
      { href: "/admin/site/about", label: "About" },
      { href: "/admin/site/directory-headers", label: "Directory headers" },
      { href: "/admin/site/footer", label: "Footer" }
    ]
  }
];

export default async function AdminSiteLayout({ children }: { children: ReactNode }) {
  await requireCapability("manage_site");

  return (
    <div className="admin-stack">
      <div>
        <div className="eyebrow">Site</div>
        <h1>Site configuration</h1>
        <p className="lede">Manage public page curation, imagery, editorial copy, and site-wide destinations.</p>
      </div>
      <AdminWorkspaceTabs groups={siteConfigurationGroups} />
      {children}
    </div>
  );
}
