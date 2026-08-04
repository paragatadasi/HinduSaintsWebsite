"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { assertCapability } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { createDirectInstagramClaimsForSaint } from "@/lib/instagram-claims";

const refreshClaimsSchema = z.object({
  saintId: z.string().cuid()
});

export async function refreshSaintInstagramClaims(formData: FormData) {
  await assertCapability("edit_content");
  const session = await auth();
  if (!session?.user?.email) redirect("/admin");

  const { saintId } = refreshClaimsSchema.parse({
    saintId: formData.get("saintId")
  });
  const saint = await db.saint.findUnique({
    where: { id: saintId },
    select: {
      id: true,
      slug: true,
      instagramItems: {
        where: {
          matchStatus: { in: ["matched", "published"] }
        },
        select: { instagramItemId: true }
      }
    }
  });

  if (!saint) redirect("/admin/saints");

  await db.$transaction(async (tx) => {
    for (const link of saint.instagramItems) {
      await createDirectInstagramClaimsForSaint(tx, link.instagramItemId, saint.id);
    }
  });

  revalidatePath("/admin/saints");
  revalidatePath(`/admin/saints/${saint.id}`);
  revalidatePath(`/admin/saints/${saint.slug}`);
}
