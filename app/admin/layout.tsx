import type { Metadata } from "next";
import Link from "next/link";
import { auth, isGoogleAuthConfigured, signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasCapability } from "@/lib/permissions";
import { getAdminUser } from "@/lib/admin-access";
import { canAccessSaintCatalog } from "@/lib/admin-saint-access";
import { AdminFormGuard } from "@/components/admin/admin-form-guard";
import { AdminPrimaryNavigation } from "@/components/admin/admin-navigation";
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
      <main className="admin-shell">
        <div className="page-shell admin-auth">
          <div className="eyebrow">Admin CMS</div>
          <h1>Sign in required</h1>
          {isGoogleAuthConfigured ? (
            <>
              <p className="lede">Use an allowlisted Google account to review and publish CMS content.</p>
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/admin" });
                }}
              >
                <button className="button button--primary" type="submit">
                  Sign in with Google
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="lede">
                Google sign-in needs a client ID and client secret before the admin CMS can authenticate users.
              </p>
              <p className="empty-note">
                Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env, then restart the Next.js dev server.
              </p>
              <button className="button button--primary" type="button" disabled>
                Sign in with Google
              </button>
            </>
          )}
        </div>
      </main>
    );
  }

  const [newFeedbackCount, adminUser, openReconciliationCount] = await Promise.all([
    db.feedbackSubmission.count({ where: { status: "new" } }),
    getAdminUser(),
    db.reconciliationIssue.count({ where: { status: "open" } })
  ]);
  const roles = adminUser?.active ? adminUser.roles : [];
  const navigationGroups = buildNavigationGroups({
    newFeedbackCount,
    openReconciliationCount,
    roles
  });

  return (
    <main className="admin-shell">
      <div className="page-shell admin-layout">
        <AdminPrimaryNavigation groups={navigationGroups} />
        <section className="admin-content">
          <AdminFormGuard>{children}</AdminFormGuard>
        </section>
      </div>
    </main>
  );
}

function buildNavigationGroups({
  newFeedbackCount,
  openReconciliationCount,
  roles
}: {
  newFeedbackCount: number;
  openReconciliationCount: number;
  roles: Parameters<typeof hasCapability>[0];
}) {
  const groups: AdminNavigationGroup[] = [];
  const operationItems: AdminNavigationGroup["items"] = [];
  if (hasCapability(roles, "view_content")) {
    operationItems.push({ count: newFeedbackCount, href: "/admin/feedback", label: "Inbox" });
  }
  if (hasCapability(roles, "manage_site")) operationItems.push({ href: "/admin/site", label: "Site" });
  if (hasCapability(roles, "view_analytics")) operationItems.push({ href: "/admin/analytics", label: "Analytics" });
  if (hasCapability(roles, "manage_users")) operationItems.push({ href: "/admin/users", label: "Users & Access" });
  if (operationItems.length > 0) groups.push({ href: operationItems[0].href, id: "operations", items: operationItems, label: "Operations" });

  if (hasCapability(roles, "view_source_data")) {
    groups.push({
      href: "/admin/source-data/reconciliation",
      id: "source-data",
      items: [
        { count: openReconciliationCount, exact: true, href: "/admin/source-data/reconciliation", label: "Reconciliation" },
        { href: "/admin/airtable", label: "Airtable" },
        { href: "/admin/source-data/instagram", label: "Instagram" }
      ],
      label: "Source Data"
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
