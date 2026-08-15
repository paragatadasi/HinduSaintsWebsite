import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCapability } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { getSourceMatchKind } from "@/lib/source-display";

const querySchema = z.string().trim().min(2).max(300);
const idSchema = z.string().cuid();
const optionalTextSchema = z.string().trim().max(1000).optional();
const optionalYearSchema = z.coerce.number().int().min(0).max(3000).optional();

export async function GET(request: Request) {
  await requireCapability("edit_structured_content");
  const url = new URL(request.url);
  const query = querySchema.safeParse(url.searchParams.get("q"));
  if (!query.success) return NextResponse.json({ options: [] });

  const input = {
    title: optionalTextSchema.parse(url.searchParams.get("title") || undefined) ?? query.data,
    author: optionalTextSchema.parse(url.searchParams.get("author") || undefined),
    publicationYear: optionalYearSchema.parse(url.searchParams.get("year") || undefined),
    url: optionalTextSchema.parse(url.searchParams.get("url") || undefined)
  };
  const excludedSaintId = idSchema.safeParse(url.searchParams.get("excludeSaintId"));
  const numericQuery = /^\d{1,4}$/.test(query.data) ? Number(query.data) : null;
  const sources = await db.source.findMany({
    where: {
      OR: [
        { title: { contains: query.data, mode: "insensitive" } },
        { author: { contains: query.data, mode: "insensitive" } },
        { publisher: { contains: query.data, mode: "insensitive" } },
        { url: { contains: query.data, mode: "insensitive" } },
        ...(numericQuery == null ? [] : [{ publicationYear: numericQuery }])
      ],
      ...(excludedSaintId.success ? {
        contentSources: {
          none: { entityType: "Saint", entityId: excludedSaintId.data }
        }
      } : {})
    },
    orderBy: { title: "asc" },
    take: 40,
    select: {
      id: true,
      title: true,
      sourceType: true,
      author: true,
      publisher: true,
      publicationYear: true,
      url: true,
      _count: { select: { contentSources: true } }
    }
  });

  return NextResponse.json({
    options: sources.map((source) => {
      const usageCount = source._count.contentSources;
      const metadata = [
        formatLabel(source.sourceType),
        source.author,
        source.publicationYear,
        usageCount > 0 ? `used on ${usageCount} page${usageCount === 1 ? "" : "s"}` : "not yet linked"
      ].filter(Boolean).join(" · ");

      return {
        value: source.id,
        label: source.title,
        description: metadata,
        keywords: [source.author, source.publisher, source.url].filter((value): value is string => Boolean(value)),
        sourceType: source.sourceType,
        author: source.author,
        publisher: source.publisher,
        publicationYear: source.publicationYear,
        url: source.url,
        usageCount,
        matchKind: getSourceMatchKind(source, input)
      };
    })
  });
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/^\w/, (letter) => letter.toUpperCase());
}
