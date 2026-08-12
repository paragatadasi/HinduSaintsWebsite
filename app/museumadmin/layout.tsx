import Link from "next/link";
import type { Metadata } from "next";
import { auth, isGoogleAuthConfigured, signIn } from "@/lib/auth";
import { museumFlowZones } from "@/lib/museum-layout-groups";
import { getMuseumProposalData } from "@/lib/museum-proposals";
import { requireCapability } from "@/lib/admin-access";
import { PRIVATE_ROBOTS } from "@/lib/private-robots";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: PRIVATE_ROBOTS
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

  await requireCapability("access_museum");

  const { sections } = getMuseumProposalData();
  const sectionByName = new Map(sections.map((section) => [section.name, section]));
  const groupedSectionNames = new Set<string>(museumFlowZones.flatMap((zone) => [...zone.sections]));
  const ungroupedSections = sections.filter((section) => !groupedSectionNames.has(section.name));

  return (
    <main className="museum-admin-shell" data-theme="nocturne">
      <div className="museum-admin-layout">
        <aside className="museum-admin-nav">
          <Link className="museum-admin-nav__home" href="/museumadmin">
            <strong>Museum Admin</strong>
            <span>Section proposals</span>
          </Link>
          <div className="museum-admin-nav__group-links">
            <Link href="/admin">Main admin</Link>
            <Link href="/">Public site</Link>
          </div>
          <nav aria-label="Museum sections">
            {museumFlowZones.map((zone, index) => (
              <section className="museum-admin-nav__group" key={zone.title}>
                <div className="museum-admin-nav__group-heading">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{zone.title}</strong>
                    <small>{zone.eyebrow}</small>
                  </div>
                </div>
                <div className="museum-admin-nav__group-links">
                  {zone.sections.map((sectionName) => {
                    const section = sectionByName.get(sectionName);
                    if (!section) return null;
                    return (
                      <Link href={`/museumadmin/${section.slug}`} key={section.slug}>
                        <span>{section.name}</span>
                        <small>{section.total}</small>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}

            {ungroupedSections.length ? (
              <section className="museum-admin-nav__group museum-admin-nav__group--review">
                <div className="museum-admin-nav__group-heading">
                  <span>R</span>
                  <div>
                    <strong>Review queue</strong>
                    <small>Needs placement</small>
                  </div>
                </div>
                <div className="museum-admin-nav__group-links">
                  {ungroupedSections.map((section) => (
                    <Link href={`/museumadmin/${section.slug}`} key={section.slug}>
                      <span>{section.name}</span>
                      <small>{section.total}</small>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </nav>
        </aside>
        <section className="museum-admin-content">{children}</section>
      </div>
    </main>
  );
}
