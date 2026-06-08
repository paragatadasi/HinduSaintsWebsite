import type { Metadata } from "next";
import Link from "next/link";
import { auth, isGoogleAuthConfigured, signIn } from "@/lib/auth";

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

  return (
    <main className="admin-shell">
      <div className="page-shell admin-layout">
        <aside className="admin-sidebar">
          <strong>Admin CMS</strong>
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/saints">Saints</Link>
          <Link href="/admin/media">Media</Link>
          <Link href="/admin/instagram">Instagram</Link>
          <Link href="/admin/biographies">Biographies</Link>
          <Link href="/admin/traditions">Traditions</Link>
        </aside>
        <section className="admin-content">{children}</section>
      </div>
    </main>
  );
}
