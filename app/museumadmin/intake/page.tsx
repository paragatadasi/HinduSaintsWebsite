import Link from "next/link";
import { requireCapability } from "@/lib/admin-access";
import { hasCapability } from "@/lib/permissions";
import { db } from "@/lib/db";
import { MuseumRelicIntake } from "@/components/admin/museum-relic-intake";
export default async function IntakePage({ searchParams }: {
    searchParams: Promise<{
        view?: string;
    }>;
}) {
    const user = await requireCapability("access_museum");
    const canReview = hasCapability(user.roles, "manage_museum");
    const reviewMode = canReview && (await searchParams).view === "review";
    const museum = await db.museum.findFirst({ where: { slug: "spn", archivedAt: null }, select: { id: true } });
    if (!museum)
        return <p>Museum intake is unavailable. Ask an administrator to check the museum setup.</p>;
    return <div className="museum-admin"><header className="museum-admin-section-heading"><div><p className="museum-admin-kicker">SPN · New arrivals</p><h1>Receive a relic</h1></div></header><nav className="admin-tab-strip" aria-label="Relic intake"><Link className="admin-tab-strip__tab" href="/museumadmin/intake" aria-current={!reviewMode ? "page" : undefined}>Team intake</Link>{canReview ? <Link className="admin-tab-strip__tab" href="/museumadmin/intake?view=review" aria-current={reviewMode ? "page" : undefined}>Curator review</Link> : null}</nav><MuseumRelicIntake key={String(reviewMode)} museumId={museum.id} canReview={canReview} reviewMode={reviewMode}/></div>;
}
