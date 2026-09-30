import { db } from "../lib/db";
import { stageMuseumImports } from "../lib/museum-import";

try {
  const audit = await stageMuseumImports(true);
  const saints = await db.saint.findMany({
    where: { status: { not: "archived" } },
    select: {
      id: true,
      displayName: true,
      museumSectionAssignments: {
        where: { assignmentType: "primary", status: { not: "archived" } },
        select: { id: true, status: true }
      }
    }
  });
  console.log(
    JSON.stringify(
      {
        ...audit,
        saintsWithoutPrimary: saints
          .filter((s) => !s.museumSectionAssignments.length)
          .map((s) => ({ id: s.id, name: s.displayName })),
        competingPrimaries: saints
          .filter((s) => s.museumSectionAssignments.length > 1)
          .map((s) => ({ id: s.id, name: s.displayName, count: s.museumSectionAssignments.length })),
        pendingProposals: await db.museumImportProposal.count({ where: { status: "pending" } })
      },
      null,
      2
    )
  );
} finally {
  await db.$disconnect();
}
