import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "./admin-access";
import { hasCapability } from "./permissions";
import { intakeWriteOriginAllowed } from "./museum-intake-domain";
import { boundedIntakeBody } from "./museum-intake-api";
import { MuseumMoveSessionError } from "./museum-move-session-domain";
import { readMuseumMoveSession, startMuseumMoveSession, updateMuseumMoveSession, type MoveSnapshotLoader } from "./museum-move-session-service";
export async function museumMoveSessionHttp(request: Request, loader: MoveSnapshotLoader) {
  try {
    const user = await getAdminUser();
    if (!user?.active) throw new MuseumMoveSessionError(401, "Sign in to continue.");
    if (!hasCapability(user.roles, "access_museum") || !hasCapability(user.roles, "view_museum_catalog")) throw new MuseumMoveSessionError(403, "Museum catalog access is required.");
    const actor = { id: user.id, canManage: hasCapability(user.roles, "manage_museum") };
    let result;
    if (request.method === "GET") {
      const query = new URL(request.url).searchParams;
      const id = query.get("sessionId");
      result = await readMuseumMoveSession(query.get("museumId") ?? "museum-spn", id ? z.string().cuid().parse(id) : undefined);
    } else {
      if (!actor.canManage) throw new MuseumMoveSessionError(403, "A museum curator must record physical moves.");
      if (!intakeWriteOriginAllowed(request.url, request.headers.get("origin"), request.headers.get("host"), process.env.AUTH_URL || process.env.NEXTAUTH_URL)) throw new MuseumMoveSessionError(403, "Reload this page before recording a move.");
      if (!request.headers.get("content-type")?.startsWith("application/json")) throw new MuseumMoveSessionError(415, "Send this action as JSON.");
      const body: unknown = JSON.parse((await boundedIntakeBody(request, 512 * 1024)).toString("utf8"));
      if (request.method === "POST") result = await startMuseumMoveSession(body, actor, loader);
      else if (request.method === "PATCH") result = await updateMuseumMoveSession(body, actor);
      else throw new MuseumMoveSessionError(405, "This action is unavailable.");
    }
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    let status = 500, message = "This move could not be recorded. Reload the session before trying again.";
    if (error instanceof MuseumMoveSessionError) { status = error.status; message = error.message; }
    else if (error instanceof z.ZodError || error instanceof SyntaxError) { status = 400; message = "Check the displays, locations and required acknowledgements."; }
    else if (error && typeof error === "object" && "code" in error && ["P2034", "P2002"].includes(String(error.code))) { status = 409; message = "This session or location changed. Reload it before trying again."; }
    else if (error && typeof error === "object" && "status" in error && error.status === 413) { status = 413; message = "Choose a smaller batch of displays."; }
    return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
}
