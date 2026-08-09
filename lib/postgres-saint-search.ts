import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { getSearchQueryTerms } from "@/lib/search-text";
import type { SaintCatalogScope } from "@/lib/admin-saint-access";

export async function getPublishedSaintSearchCandidateIds(query: string) {
  return getSaintSearchCandidateIds(query, "published");
}

export async function getSaintSearchCandidateIds(query: string, scope: SaintCatalogScope) {
  const terms = getSearchQueryTerms(query);
  if (terms.length === 0) return [];
  const scopeSql = getSaintScopeSql(scope);

  const searchTermRows = Prisma.join(
    terms.map((term) => Prisma.sql`(${term})`)
  );
  const candidates = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    WITH search_terms("term") AS (
      VALUES ${searchTermRows}
    ),
    candidate_ids AS (
      SELECT saint."id" AS "id"
      FROM "Saint" AS saint
      JOIN search_terms AS search_term ON (
        lower(saint."displayName") % search_term."term"
        OR search_term."term" <% lower(saint."displayName")
        OR lower(saint."displayName") LIKE '%' || search_term."term" || '%'
        OR lower(saint."canonicalName") % search_term."term"
        OR search_term."term" <% lower(saint."canonicalName")
        OR lower(saint."canonicalName") LIKE '%' || search_term."term" || '%'
      )
      WHERE ${scopeSql}

      UNION

      SELECT alias."saintId" AS "id"
      FROM "SaintAlias" AS alias
      JOIN "Saint" AS saint ON saint."id" = alias."saintId"
      JOIN search_terms AS search_term ON (
        lower(alias."alias") % search_term."term"
        OR search_term."term" <% lower(alias."alias")
        OR lower(alias."alias") LIKE '%' || search_term."term" || '%'
      )
      WHERE ${scopeSql}

      UNION

      SELECT saint_place."saintId" AS "id"
      FROM "SaintPlace" AS saint_place
      JOIN "Saint" AS saint ON saint."id" = saint_place."saintId"
      JOIN "Place" AS place ON place."id" = saint_place."placeId"
      JOIN search_terms AS search_term ON (
        lower(place."name") % search_term."term"
        OR search_term."term" <% lower(place."name")
        OR lower(place."name") LIKE '%' || search_term."term" || '%'
        OR lower(coalesce(place."region", '')) LIKE '%' || search_term."term" || '%'
        OR lower(coalesce(place."country", '')) LIKE '%' || search_term."term" || '%'
        OR EXISTS (
          SELECT 1
          FROM unnest(place."alternateNames") AS alternate_name
          WHERE lower(alternate_name) % search_term."term"
            OR search_term."term" <% lower(alternate_name)
            OR lower(alternate_name) LIKE '%' || search_term."term" || '%'
        )
      )
      WHERE ${scopeSql}

      UNION

      SELECT saint_tradition."saintId" AS "id"
      FROM "SaintTradition" AS saint_tradition
      JOIN "Saint" AS saint ON saint."id" = saint_tradition."saintId"
      JOIN "Tradition" AS tradition ON tradition."id" = saint_tradition."traditionId"
      JOIN search_terms AS search_term ON (
        lower(tradition."name") % search_term."term"
        OR search_term."term" <% lower(tradition."name")
        OR lower(tradition."name") LIKE '%' || search_term."term" || '%'
        OR EXISTS (
          SELECT 1
          FROM unnest(tradition."alternateNames") AS alternate_name
          WHERE lower(alternate_name) % search_term."term"
            OR search_term."term" <% lower(alternate_name)
            OR lower(alternate_name) LIKE '%' || search_term."term" || '%'
        )
      )
      WHERE ${scopeSql}

      UNION

      SELECT saint."id" AS "id"
      FROM "Saint" AS saint
      JOIN search_terms AS search_term ON (
        lower(coalesce(saint."shortDescription", '')) LIKE '%' || search_term."term" || '%'
        OR lower(coalesce(saint."eraLabel", '')) LIKE '%' || search_term."term" || '%'
        OR lower(coalesce(saint."birthDateRaw", '')) LIKE '%' || search_term."term" || '%'
        OR lower(coalesce(saint."samadhiDateRaw", '')) LIKE '%' || search_term."term" || '%'
        OR replace(lower(saint."teamVisibility"::text), '_', ' ') LIKE '%' || search_term."term" || '%'
        OR replace(lower(saint."publicationStatus"::text), '_', ' ') LIKE '%' || search_term."term" || '%'
        OR replace(lower(saint."workflowStatus"::text), '_', ' ') LIKE '%' || search_term."term" || '%'
      )
      WHERE ${scopeSql}
    )
    SELECT DISTINCT "id"
    FROM candidate_ids
  `);

  return candidates.map(({ id }) => id);
}

function getSaintScopeSql(scope: SaintCatalogScope) {
  if (scope === "full") return Prisma.sql`TRUE`;
  if (scope === "public") return Prisma.sql`saint."teamVisibility" = 'public'`;
  return Prisma.sql`saint."publicationStatus" = 'published'`;
}
