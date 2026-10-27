import { randomUUID } from "node:crypto";
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
    const requestedView = (await searchParams).view;

    const museum = await db.museum.findFirst({ where: { slug: "spn", archivedAt: null }, select: { id: true } });
    if (!museum)
        return <p>Museum intake is unavailable. Ask an administrator to check the museum setup.</p>;
    const canTeam = canReview || !!await db.museumIntakeTeamMember.findUnique({where:{userId_museumId:{userId:user.id,museumId:museum.id}}});
    const initialView = canReview && requestedView === "review" ? "review" : canTeam && requestedView === "team" ? "team" : requestedView === "entries" ? "entries" : "intake";
    return <MuseumRelicIntake canTeam={canTeam} museumId={museum.id} userId={user.id} canReview={canReview} initialView={initialView} initialRelicId={randomUUID()}/>;
}
