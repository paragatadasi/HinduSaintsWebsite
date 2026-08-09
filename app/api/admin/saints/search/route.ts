import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSaintCatalogUser } from "@/lib/admin-access";
import { getAdminSaintCatalogScope } from "@/lib/admin-saint-access";
import { saintSearchDescription, searchSaintCatalog } from "@/lib/admin-saint-search";

const querySchema = z.string().trim().min(2).max(100);
const idSchema = z.string().cuid();

export async function GET(request: Request) {
  const user = await requireSaintCatalogUser();
  const url = new URL(request.url);
  const query = querySchema.safeParse(url.searchParams.get("q"));
  if (!query.success) return NextResponse.json({ options: [] });
  const excludedId = idSchema.safeParse(url.searchParams.get("exclude"));

  const scope = getAdminSaintCatalogScope(user.roles, url.searchParams.get("scope"));
  const saints = await searchSaintCatalog({ query: query.data, scope, limit: 40 });

  return NextResponse.json({
    options: saints.filter((saint) => !excludedId.success || saint.id !== excludedId.data).map((saint) => ({
      value: saint.id,
      label: saint.displayName,
      description: saintSearchDescription(saint),
      keywords: [saint.canonicalName, ...saint.aliases.map((alias) => alias.alias)]
    }))
  });
}
