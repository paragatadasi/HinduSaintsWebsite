import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "./admin-access";
import { hasCapability } from "./permissions";
import { MuseumIntakeError, intakeWriteOriginAllowed } from "./museum-intake-domain";
import type { IntakeActor } from "./museum-intake-service";

export async function intakeApi(request: Request, operation: (actor: IntakeActor) => Promise<unknown>) {
  try {
    const user = await getAdminUser();
    if (!user?.active) throw new MuseumIntakeError(401, "Sign in to continue.");
    if (!hasCapability(user.roles, "access_museum")) throw new MuseumIntakeError(403, "Museum access is required.");
    if (!["GET", "HEAD"].includes(request.method) && !intakeWriteOriginAllowed(request.url, request.headers.get("origin"), request.headers.get("host"), process.env.AUTH_URL || process.env.NEXTAUTH_URL)) {
      throw new MuseumIntakeError(403, "Reload this page before saving.");
    }
    const result = await operation({ id: user.id, canReview: hasCapability(user.roles, "manage_museum"), roles: user.roles });
    if (result instanceof Response) return result;
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    let status = 500, message = "This entry could not be saved. Reload it before trying again.";
    if (error instanceof MuseumIntakeError) { status = error.status; message = error.message; }
    else if (error instanceof z.ZodError || error instanceof SyntaxError) { status = 400; message = "Check the entry fields and try again."; }
    else if (error && typeof error === "object" && "code" in error && ["P2034", "P2002"].includes(String(error.code))) {
      status = 409; message = "This entry changed. Reload it before saving.";
    }
    return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
}

export async function boundedIntakeBody(request: Request, limit: number) {
  const reader = request.body?.getReader();
  if (!reader) throw new MuseumIntakeError(400, "The entry is empty.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new MuseumIntakeError(413, "This upload is too large."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}
export async function intakeJson(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new MuseumIntakeError(415, "Send the entry as JSON.");
  return JSON.parse((await boundedIntakeBody(request, 32 * 1024)).toString("utf8")) as unknown;
}
export const intakeId = z.string().cuid();
