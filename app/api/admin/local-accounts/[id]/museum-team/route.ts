import { z } from "zod";
import { localAccountHttp } from "@/lib/local-account-http";
import { updateLocalMuseumTeam } from "@/lib/local-accounts";
export const runtime = "nodejs";
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  return localAccountHttp(request, true, async (body, actorId) => updateLocalMuseumTeam(z.string().cuid().parse((await context.params).id), body, actorId));
}
