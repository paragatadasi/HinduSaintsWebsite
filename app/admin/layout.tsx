import type { Metadata } from "next";
import { auth, isGoogleAuthConfigured, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasCapability } from "@/lib/permissions";
import { getAdminUser } from "@/lib/admin-access";
import { canAccessSaintCatalog } from "@/lib/admin-saint-access";
import { AdminFormGuard } from "@/components/admin/admin-form-guard";
import { AdminPrimaryNavigation } from "@/components/admin/admin-navigation";
import { AdminSignIn } from "@/components/admin/admin-sign-in";
import type { AdminNavigationGroup } from "@/lib/admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.email) {
    return (
      <AdminSignIn
        configured={isGoogleAuthConfigured}
        configurationDescription="Google sign-in needs a client ID and client secret before the admin CMS can authenticate users."
        description="Use an allowlisted Google account to review and publish CMS content."
        redirectTo="/admin"
        workspaceLabel="Admin CMS"
        workspaceSubtitle="Editorial workspace"
      />
    );
  }

  const adminUser = await getAdminUser();
  const roles = adminUser?.active ? adminUser.roles : [];
  const [newFeedbackCount, openReconciliationCount, openDuplicateCount] = await Promise.all([
    hasCapability(roles, "view_feedback_inbox")
      ? db.feedbackSubmission.count({ where: { status: "new" } })
      : Promise.resolve(0),
    db.reconciliationIssue.count({ where: { status: "open" } }),
    db.duplicateCandidate.count({ where: { entityType: "Saint", status: "open" } })
  ]);
  const navigationGroups = buildNavigationGroups({
    newFeedbackCount,
    openDuplicateCount,
    openReconciliationCount,
    roles
  });

  return (
    <main className="admin-shell">
      <div className="page-shell admin-layout">
        <AdminPrimaryNavigation
          groups={navigationGroups}
          logoutAction={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        />
        <section className="admin-content">
          <AdminFormGuard>{children}</AdminFormGuard>
        </section>
      </div>
    </main>
  );
}

function buildNavigationGroups({
  newFeedbackCount,
  openDuplicateCount,
  openReconciliationCount,
  roles
}: {
  newFeedbackCount: number;
  openDuplicateCount: number;
  openReconciliationCount: number;
  roles: Parameters<typeof hasCapability>[0];
}) {
  const groups: AdminNavigationGroup[] = [];
  const operationItems: AdminNavigationGroup["items"] = [];
  if (hasCapability(roles, "view_feedback_inbox")) {
    operationItems.push({ count: newFeedbackCount, href: "/admin/feedback", label: "Inbox" });
  }
  if (hasCapability(roles, "manage_site")) operationItems.push({ href: "/admin/site", label: "Site" });
  if (hasCapability(roles, "view_analytics")) operationItems.push({ href: "/admin/analytics", label: "Analytics" });
  if (hasCapability(roles, "manage_users")) operationItems.push({ href: "/admin/users", label: "Users & Access" });
  if (operationItems.length > 0) groups.push({ href: operationItems[0].href, id: "operations", items: operationItems, label: "Operations" });

  const canViewSourceData = hasCapability(roles, "view_source_data");
  const canResolveDuplicates = hasCapability(roles, "resolve_duplicate_saints");
  if (canViewSourceData || canResolveDuplicates) {
    const reconciliationCount = openDuplicateCount + (canViewSourceData ? openReconciliationCount : 0);
    const sourceItems: AdminNavigationGroup["items"] = [
      { count: reconciliationCount, exact: true, href: "/admin/source-data/reconciliation", label: "Reconciliation" }
    ];
    if (canViewSourceData) {
      sourceItems.push({ href: "/admin/airtable", label: "Airtable" });
      sourceItems.push({ href: "/admin/source-data/instagram", label: "Instagram" });
    }
    groups.push({
      href: "/admin/source-data/reconciliation",
      id: "source-data",
      items: sourceItems,
      label: canViewSourceData ? "Source Data" : "Review"
    });
  }

  const contentItems: AdminNavigationGroup["items"] = [];
  if (hasCapability(roles, "view_instagram_review")) contentItems.push({ href: "/admin/instagram", label: "Instagram" });
  if (canAccessSaintCatalog(roles)) contentItems.push({ href: "/admin/saints", label: "Saints" });
  if (hasCapability(roles, "view_content")) {
    contentItems.push({ href: "/admin/traditions", label: "Traditions" });
    contentItems.push({ href: "/admin/places", label: "Places" });
  }
  if (contentItems.length > 0) {
    groups.push({
      href: contentItems[0].href,
      id: "content",
      items: contentItems,
      label: "Content"
    });
  }

  if (hasCapability(roles, "access_museum")) {
    groups.push({
      href: "/admin/museum",
      id: "museum",
      items: [{ href: "/admin/museum", label: "Museum" }],
      label: "Museum",
      standalone: true
    });
  }

  return groups;
}
