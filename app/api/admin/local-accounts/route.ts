import { localAccountHttp } from "@/lib/local-account-http";
import { createLocalMuseumAccount } from "@/lib/local-accounts";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return localAccountHttp(request, true, (body, actorId) => createLocalMuseumAccount(body, actorId));
}
