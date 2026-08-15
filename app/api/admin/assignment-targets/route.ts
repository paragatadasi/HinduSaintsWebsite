import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { hasCapability } from "@/lib/permissions";
import { saintSearchDescription, searchSaintCatalog } from "@/lib/admin-saint-search";

const querySchema = z.string().trim().min(2).max(100);
const RESULTS_PER_TYPE = 30;
const RESULT_LIMIT = 60;

type TargetOption = {
  value: string;
  label: string;
  description: string;
};

export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user?.active || !hasCapability(user.roles, "manage_assignments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = querySchema.safeParse(new URL(request.url).searchParams.get("q"));
  if (!parsed.success) {
    return NextResponse.json({ options: [] });
  }

  const query = parsed.data;
  const [saints, exactTraditions, traditions, exactPlaces, places, exactPosts, posts] = await Promise.all([
    searchSaintCatalog({ query, scope: "full", limit: RESULTS_PER_TYPE }),
    db.tradition.findMany({
      where: { name: { equals: query, mode: "insensitive" }, workflowStatus: { not: "polished" } },
      take: RESULTS_PER_TYPE,
      select: { id: true, name: true, workflowStatus: true }
    }),
    db.tradition.findMany({
      where: { name: { contains: query, mode: "insensitive" }, workflowStatus: { not: "polished" } },
      orderBy: { name: "asc" },
      take: RESULTS_PER_TYPE,
      select: { id: true, name: true, workflowStatus: true }
    }),
    db.place.findMany({
      where: { name: { equals: query, mode: "insensitive" }, workflowStatus: { not: "polished" } },
      take: RESULTS_PER_TYPE,
      select: { id: true, name: true, workflowStatus: true }
    }),
    db.place.findMany({
      where: { name: { contains: query, mode: "insensitive" }, workflowStatus: { not: "polished" } },
      orderBy: { name: "asc" },
      take: RESULTS_PER_TYPE,
      select: { id: true, name: true, workflowStatus: true }
    }),
    db.instagramItem.findMany({
      where: {
        OR: [
          { extractedSaintName: { equals: query, mode: "insensitive" } },
          { instagramShortcode: { equals: query, mode: "insensitive" } }
        ]
      },
      take: RESULTS_PER_TYPE,
      select: { id: true, extractedSaintName: true, instagramShortcode: true, status: true }
    }),
    db.instagramItem.findMany({
      where: {
        OR: [
          { extractedSaintName: { contains: query, mode: "insensitive" } },
          { instagramShortcode: { contains: query, mode: "insensitive" } }
        ]
      },
      orderBy: { createdAt: "desc" },
      take: RESULTS_PER_TYPE,
      select: { id: true, extractedSaintName: true, instagramShortcode: true, status: true }
    })
  ]);

  const saintOptions = saints
    .filter((row) => row.workflowStatus !== "polished")
    .map((row) => ({ value: `saint:${row.id}`, label: row.displayName, description: `Saint · ${saintSearchDescription(row)}` }));
  const traditionOptions = [...exactTraditions, ...traditions].map((row) => ({ value: `tradition:${row.id}`, label: row.name, description: `Tradition · ${workflowLabel(row.workflowStatus)}` }));
  const placeOptions = [...exactPlaces, ...places].map((row) => ({ value: `place:${row.id}`, label: row.name, description: `Place · ${workflowLabel(row.workflowStatus)}` }));
  const postOptions = [...exactPosts, ...posts].map((row) => ({
    value: `instagram_item:${row.id}`,
    label: row.extractedSaintName || row.instagramShortcode || "Instagram post",
    description: `Instagram · ${row.status}`
  }));
  const options = uniqueOptions([...saintOptions, ...traditionOptions, ...placeOptions, ...postOptions]);

  return NextResponse.json({ options: rankOptions(options, query).slice(0, RESULT_LIMIT) });
}

function uniqueOptions(options: TargetOption[]) {
  return [...new Map(options.map((option) => [option.value, option])).values()];
}

function rankOptions(options: TargetOption[], query: string) {
  const term = query.toLocaleLowerCase();
  return options.sort((left, right) => {
    const rankDifference = matchRank(left.label, term) - matchRank(right.label, term);
    return rankDifference || left.label.localeCompare(right.label) || left.description.localeCompare(right.description);
  });
}

function matchRank(label: string, term: string) {
  const normalizedLabel = label.toLocaleLowerCase();
  if (normalizedLabel === term) return 0;
  if (normalizedLabel.startsWith(term)) return 1;
  return 2;
}

function workflowLabel(value: string) {
  return value.replaceAll("_", " ");
}
