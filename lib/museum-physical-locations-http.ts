import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "./admin-access";
import { hasCapability } from "./permissions";
import { intakeWriteOriginAllowed } from "./museum-intake-domain";
import { boundedIntakeBody } from "./museum-intake-api";
import { MuseumMoveSessionError } from "./museum-move-session-domain";
import { confirmMuseumPhysicalLocations, undoMuseumPhysicalCheck, readMuseumPhysicalLocations, type PhysicalSnapshotLoader } from "./museum-physical-locations";

export async function museumPhysicalLocationsHttp(request: Request, loader: PhysicalSnapshotLoader) {
  const started = performance.now();
  try {
    const user = await getAdminUser();
    if (!user?.active) throw new MuseumMoveSessionError(401, "Sign in to continue.");
    if (!hasCapability(user.roles, "access_museum") || !hasCapability(user.roles, "view_museum_catalog")) throw new MuseumMoveSessionError(403, "Museum catalog access is required.");
    let result;
    if (request.method === "GET") {
      const query = new URL(request.url).searchParams;
      if ((query.get("museumId") ?? "museum-spn") !== "museum-spn") throw new MuseumMoveSessionError(400, "Choose the SPN museum.");
      const ids = z.array(z.string().min(1).max(200)).max(2000).parse(query.getAll("sourceId"));
      result = await readMuseumPhysicalLocations(loader, ids.length ? [...new Set(ids)] : undefined);
    } else if (request.method === "POST") {
      if (!hasCapability(user.roles, "manage_museum")) throw new MuseumMoveSessionError(403, "A museum curator must record physical locations.");
      if (!intakeWriteOriginAllowed(request.url, request.headers.get("origin"), request.headers.get("host"), process.env.AUTH_URL || process.env.NEXTAUTH_URL)) throw new MuseumMoveSessionError(403, "Reload this page before recording a location.");
      if (!request.headers.get("content-type")?.startsWith("application/json")) throw new MuseumMoveSessionError(415, "Send this confirmation as JSON.");
      const body: unknown = JSON.parse((await boundedIntakeBody(request, 512 * 1024)).toString("utf8"));
      result = body && typeof body === "object" && "action" in body && body.action === "undo"
        ? await undoMuseumPhysicalCheck(body, { id: user.id, canManage: true }, loader)
        : await confirmMuseumPhysicalLocations(body, { id: user.id, canManage: true }, loader);
    } else throw new MuseumMoveSessionError(405, "This action is unavailable.");
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store", "Server-Timing": `museum;dur=${(performance.now() - started).toFixed(1)}` } });
  } catch (error) {
    let status = 500, message = "These locations could not be recorded. Reload the current locations before trying again.";
    if (error instanceof MuseumMoveSessionError) { status = error.status; message = error.message; }
    else if (error instanceof z.ZodError || error instanceof SyntaxError) { status = 400; message = "Check the source records, confirmed date, locations and acknowledgements."; }
    else if (error && typeof error === "object" && "code" in error && ["P2034", "P2002"].includes(String(error.code))) { status = 409; message = "A physical location changed. Reload before recording this confirmation."; }
    else if (error && typeof error === "object" && "status" in error && error.status === 413) { status = 413; message = "Choose a smaller batch of source records."; }
    return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store", "Server-Timing": `museum;dur=${(performance.now() - started).toFixed(1)}` } });
  }
}
