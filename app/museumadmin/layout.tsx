import Link from "next/link";
import type { Metadata } from "next";
import { auth, isGoogleAuthConfigured, signIn } from "@/lib/auth";
import { getMuseumProposalData } from "@/lib/museum-proposals";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default async function MuseumAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.email) {
    return (
      <main className="admin-shell">
        <div className="page-shell admin-auth">
          <div className="eyebrow">Museum Admin</div>
          <h1>Sign in required</h1>
          {isGoogleAuthConfigured ? (
            <>
              <p className="lede">Use an allowlisted Google account to review museum section proposals.</p>
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/museumadmin" });
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
                Google sign-in needs a client ID and client secret before the museum admin can authenticate users.
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

  const { sections } = getMuseumProposalData();

  return (
    <main className="museum-admin-shell" data-theme="nocturne">
      <div className="museum-admin-layout">
        <aside className="museum-admin-nav">
          <Link className="museum-admin-nav__home" href="/museumadmin">
            <strong>Museum Admin</strong>
            <span>Section proposals</span>
          </Link>
          <nav aria-label="Museum sections">
            {sections.map((section) => (
              <Link href={`/museumadmin/${section.slug}`} key={section.slug}>
                <span>{section.name}</span>
                <small>{section.total}</small>
              </Link>
            ))}
          </nav>
        </aside>
        <section className="museum-admin-content">{children}</section>
      </div>
    </main>
  );
}
