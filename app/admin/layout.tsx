import type { Metadata } from "next";
import Link from "next/link";
import { auth, isGoogleAuthConfigured, signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasCapability } from "@/lib/permissions";
import { getAdminUser } from "@/lib/admin-access";
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
  const myWorkCount = adminUser?.active ? await db.contentAssignment.count({ where: { assigneeId: adminUser.id, state: { in: ["assigned", "in_progress", "blocked"] } } }) : 0;
  const navigationGroups = buildNavigationGroups({
    myWorkCount,
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
  myWorkCount,
  newFeedbackCount,
  openReconciliationCount,
  roles
}: {
  myWorkCount: number;
  newFeedbackCount: number;
  openReconciliationCount: number;
  roles: Parameters<typeof hasCapability>[0];
}) {
  const groups: AdminNavigationGroup[] = [];
  const operationItems: AdminNavigationGroup["items"] = [{ exact: true, href: "/admin", label: "Dashboard" }];
  if (hasCapability(roles, "view_content")) {
    operationItems.push(
      { count: myWorkCount, href: "/admin/work", label: "My Work" },
      { count: newFeedbackCount, href: "/admin/feedback", label: "Inbox" }
    );
  }
  if (hasCapability(roles, "manage_site")) operationItems.push({ href: "/admin/site", label: "Site" });
  if (hasCapability(roles, "view_analytics")) operationItems.push({ href: "/admin/analytics", label: "Analytics" });
  if (hasCapability(roles, "manage_users")) operationItems.push({ href: "/admin/users", label: "Users & Access" });
  groups.push({ href: "/admin", id: "operations", items: operationItems, label: "Operations" });

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

  if (hasCapability(roles, "view_content")) {
    groups.push({
      href: "/admin/instagram",
      id: "content",
      items: [
        { href: "/admin/instagram", label: "Instagram" },
        { href: "/admin/saints", label: "Saints" },
        { href: "/admin/traditions", label: "Traditions" },
        { href: "/admin/places", label: "Places" }
      ],
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
