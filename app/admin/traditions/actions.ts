"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { toSlug } from "@/lib/slugs";

const contentStatusSchema = z.enum(["draft", "needs_review", "published", "hidden", "archived"]);

const traditionEditorSchema = z.object({
  traditionId: z.string().cuid(),
  name: z.string().trim().min(1).max(200),
  alternateNames: z.array(z.string().trim().min(1).max(200)).max(100),
  parentTraditionId: z.string().cuid().optional(),
  shortDescription: z.string().trim().max(500).optional(),
  longIntroductionMarkdown: z.string().trim().max(20000).optional(),
  status: contentStatusSchema,
  seoTitle: z.string().trim().max(120).optional(),
  seoDescription: z.string().trim().max(300).optional()
});

const mergeTraditionsSchema = z.object({
  sourceTraditionId: z.string().cuid(),
  targetTraditionId: z.string().cuid()
}).refine((value) => value.sourceTraditionId !== value.targetTraditionId, {
  message: "Choose two different traditions."
});

export async function updateTradition(formData: FormData) {
  await requireAdminSession();

  const parsed = traditionEditorSchema.parse({
    traditionId: formData.get("traditionId"),
    name: formData.get("name"),
    alternateNames: parseList(formData.get("alternateNames")),
    parentTraditionId: emptyToUndefined(formData.get("parentTraditionId")),
    shortDescription: emptyToUndefined(formData.get("shortDescription")),
    longIntroductionMarkdown: emptyToUndefined(formData.get("longIntroductionMarkdown")),
    status: formData.get("status"),
    seoTitle: emptyToUndefined(formData.get("seoTitle")),
    seoDescription: emptyToUndefined(formData.get("seoDescription"))
  });
  const now = new Date();
  const existing = await db.tradition.findUnique({
    where: { id: parsed.traditionId },
    select: { slug: true }
  });

  if (!existing) redirect("/admin/traditions");

  const slug = await getUniqueTraditionSlug(parsed.name, parsed.traditionId);
  const tradition = await db.tradition.update({
    where: { id: parsed.traditionId },
    data: {
      name: parsed.name,
      slug,
      alternateNames: parsed.alternateNames,
      parentTraditionId: parsed.parentTraditionId === parsed.traditionId ? null : parsed.parentTraditionId ?? null,
      shortDescription: parsed.shortDescription ?? null,
      longIntroductionMarkdown: parsed.longIntroductionMarkdown ?? null,
      status: parsed.status,
      seoTitle: parsed.seoTitle ?? null,
      seoDescription: parsed.seoDescription ?? null,
      publishedAt: parsed.status === "published" ? now : null
    },
    select: { slug: true }
  });

  revalidateTraditionPaths(existing.slug);
  revalidateTraditionPaths(tradition.slug);
  redirect(`/admin/traditions/${tradition.slug}`);
}

export async function mergeTraditions(formData: FormData) {
  await requireAdminSession();

  const parsed = mergeTraditionsSchema.parse({
    sourceTraditionId: formData.get("sourceTraditionId"),
    targetTraditionId: formData.get("targetTraditionId")
  });
  const [source, target] = await Promise.all([
    db.tradition.findUnique({
      where: { id: parsed.sourceTraditionId },
      include: { saints: true }
    }),
    db.tradition.findUnique({
      where: { id: parsed.targetTraditionId },
      include: { saints: true }
    })
  ]);

  if (!source || !target) redirect("/admin/traditions");

  await db.$transaction(async (tx) => {
    const targetLinksBySaintId = new Map(target.saints.map((link) => [link.saintId, link]));

    for (const sourceLink of source.saints) {
      const targetLink = targetLinksBySaintId.get(sourceLink.saintId);

      if (targetLink) {
        await tx.saintTradition.update({
          where: { id: targetLink.id },
          data: {
            isPrimary: targetLink.isPrimary || sourceLink.isPrimary,
            notes: combineNotes(targetLink.notes, sourceLink.notes)
          }
        });
        continue;
      }

      await tx.saintTradition.update({
        where: { id: sourceLink.id },
        data: { traditionId: target.id }
      });
    }

    await tx.contentSource.updateMany({
      where: { entityType: "Tradition", entityId: source.id },
      data: { entityId: target.id }
    });
    await tx.tradition.updateMany({
      where: { parentTraditionId: source.id },
      data: { parentTraditionId: target.id }
    });
    await tx.tradition.delete({ where: { id: source.id } });
  });

  revalidateTraditionPaths(source.slug);
  revalidateTraditionPaths(target.slug);
  redirect(`/admin/traditions/${target.slug}`);
}

async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/admin");
  }
}

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseList(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return [];
  return Array.from(new Set(value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean)));
}

function combineNotes(first: string | null, second: string | null) {
  return [first, second].filter(Boolean).join("\n\n") || null;
}

async function getUniqueTraditionSlug(name: string, traditionId: string) {
  const baseSlug = toSlug(name) || "tradition";
  let candidate = baseSlug;
  let suffix = 2;

  while (await db.tradition.findFirst({ where: { slug: candidate, NOT: { id: traditionId } }, select: { id: true } })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function revalidateTraditionPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/traditions");
  revalidatePath("/traditions");
  revalidatePath(`/traditions/${slug}`);
}
