import type { Metadata, Route } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { auth, isGoogleAuthConfigured, signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasCapability } from "@/lib/permissions";
import { getAdminUser } from "@/lib/admin-access";

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

  const [newFeedbackCount, adminUser] = await Promise.all([
    db.feedbackSubmission.count({ where: { status: "new" } }),
    getAdminUser()
  ]);
  const roles = adminUser?.active ? adminUser.roles : [];

  return (
    <main className="admin-shell">
      <div className="page-shell admin-layout">
        <aside className="admin-sidebar">
          <Link href="/admin">
            <strong>Admin CMS</strong>
          </Link>
          <Link href="/admin">Dashboard</Link>
          <NavGroup label="Operations">
            {hasCapability(roles, "view_content") ? <Link className="admin-sidebar__link" href="/admin/feedback"><span>Inbox</span>{newFeedbackCount > 0 ? <StatusBadge label={String(newFeedbackCount)} /> : null}</Link> : null}
            {hasCapability(roles, "manage_site") ? <Link href={"/admin/site" as Route}>Site</Link> : null}
            {hasCapability(roles, "view_analytics") ? <Link href={"/admin/analytics" as Route}>Analytics</Link> : null}
            {hasCapability(roles, "manage_users") ? <Link href={"/admin/users" as Route}>Users &amp; Access</Link> : null}
          </NavGroup>
          {hasCapability(roles, "view_source_data") ? <NavGroup label="Source Data">
            <Link href="/admin/airtable">Airtable Import</Link>
            <Link href={"/admin/source-data/instagram" as Route}>Instagram Import</Link>
          </NavGroup> : null}
          {hasCapability(roles, "view_content") ? <NavGroup label="Content">
            <Link href="/admin/instagram">Instagram Posts</Link>
            <Link href="/admin/saints">Saints</Link>
            <Link href="/admin/traditions">Traditions</Link>
            <Link href="/admin/places">Places</Link>
          </NavGroup> : null}
          {hasCapability(roles, "access_museum") ? <Link className="admin-sidebar__primary-link" href="/admin/museum">Museum</Link> : null}
        </aside>
        <section className="admin-content">{children}</section>
      </div>
    </main>
  );
}

function NavGroup({ children, label }: { children: React.ReactNode; label: string }) {
  return <div className="admin-sidebar__group"><div className="admin-sidebar__heading">{label}</div>{children}</div>;
}
