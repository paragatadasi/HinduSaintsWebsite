import { z } from "zod";
import { localAccountHttp } from "@/lib/local-account-http";
import { resetLocalMuseumPassword } from "@/lib/local-accounts";
export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return localAccountHttp(request, true, async (body, actorId) => resetLocalMuseumPassword(z.string().cuid().parse((await context.params).id), body, actorId));
}
