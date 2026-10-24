"use server";
import { MuseumSourceReviewError, museumSourceDecisionSchema } from "@/lib/museum-source-review-domain";
import { Prisma } from "@/lib/generated/prisma/client";
import { ZodError } from "zod";
import { decideMuseumSource } from "@/lib/museum-source-review-service";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertCapability } from "@/lib/admin-access";
export async function reviewMuseumSource(form:FormData) {
  await assertCapability("view_source_data");
  const actor=await assertCapability("resolve_reconciliation");
  try {
    const input=museumSourceDecisionSchema.parse(Object.fromEntries(form));
    await decideMuseumSource(actor.id,input);
  } catch (error) {
    const code=error instanceof MuseumSourceReviewError?error.code
      :error instanceof ZodError?"invalid_input"
      :error instanceof Prisma.PrismaClientKnownRequestError && ["P2028","P1008"].includes(error.code)?"timeout"
      :error instanceof Prisma.PrismaClientKnownRequestError && ["P2034","P2025","P2002"].includes(error.code)?"conflict":"review";
    redirect(`/admin/source-data/museum?error=${code}`);
  }
  revalidatePath("/museumadmin","layout");revalidatePath("/admin/source-data/museum");redirect("/admin/source-data/museum?saved=1");
}
