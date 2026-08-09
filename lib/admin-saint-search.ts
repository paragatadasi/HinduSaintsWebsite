import { db } from "@/lib/db";
import { saintCatalogWhere, type SaintCatalogScope } from "@/lib/admin-saint-access";
import { getSaintSearchCandidateIds } from "@/lib/postgres-saint-search";
import { rankSaintSearchResults } from "@/lib/saint-search";

export async function searchSaintCatalog({
  limit = 40,
  query,
  scope
}: {
  limit?: number;
  query: string;
  scope: SaintCatalogScope;
}) {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) return [];

  const candidateIds = await getSaintSearchCandidateIds(normalizedQuery, scope);
  if (candidateIds.length === 0) return [];

  const saints = await db.saint.findMany({
    where: {
      AND: [saintCatalogWhere(scope), { id: { in: candidateIds } }]
    },
    include: {
      aliases: { select: { alias: true } },
      places: {
        include: { place: true },
        orderBy: { placeType: "asc" }
      },
      traditions: {
        include: { tradition: true },
        orderBy: { isPrimary: "desc" }
      }
    }
  });

  return rankSaintSearchResults(saints, normalizedQuery, { includeAdminFields: scope !== "published", limit })
    .map(({ item, score }) => ({ ...item, searchScore: score }));
}

export function saintSearchDescription(saint: {
  canonicalName: string;
  displayName: string;
  publicationStatus: string;
  teamVisibility: string;
  workflowStatus: string;
}) {
  const name = saint.canonicalName !== saint.displayName ? saint.canonicalName : undefined;
  return [name, label(saint.teamVisibility), label(saint.publicationStatus), label(saint.workflowStatus)]
    .filter(Boolean)
    .join(" · ");
}

function label(value: string) {
  return value.replaceAll("_", " ");
}
