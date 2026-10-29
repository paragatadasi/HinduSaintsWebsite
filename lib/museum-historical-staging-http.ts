import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "./admin-access";
import { hasCapability } from "./permissions";
import { intakeWriteOriginAllowed } from "./museum-intake-domain";
import { boundedIntakeBody } from "./museum-intake-api";
import { MuseumMoveSessionError } from "./museum-move-session-domain";
import type { PhysicalSnapshotLoader } from "./museum-physical-locations";
import { readHistoricalStaging, reconcileHistoricalStaging } from "./museum-historical-staging";

export async function historicalStagingHttp(request: Request, loader: PhysicalSnapshotLoader) {
  try {
    const user = await getAdminUser();
    if (!user?.active) throw new MuseumMoveSessionError(401, "Sign in to continue.");
    if (!(["access_museum", "view_museum_catalog", "manage_museum"] as const).every(capability => hasCapability(user.roles, capability)))
      throw new MuseumMoveSessionError(403, "A museum curator must review staging corrections.");
    let result;
    if (request.method === "GET") result = await readHistoricalStaging(loader);
    else if (request.method === "POST") {
      if (!intakeWriteOriginAllowed(request.url, request.headers.get("origin"), request.headers.get("host"), process.env.AUTH_URL || process.env.NEXTAUTH_URL))
        throw new MuseumMoveSessionError(403, "Reload before recording the correction.");
      if (!request.headers.get("content-type")?.startsWith("application/json")) throw new MuseumMoveSessionError(415, "Send the correction as JSON.");
      const body: unknown = JSON.parse((await boundedIntakeBody(request, 512 * 1024)).toString("utf8"));
      result = await reconcileHistoricalStaging(body, { id: user.id, canManage: true }, loader);
    } else throw new MuseumMoveSessionError(405, "This action is unavailable.");
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    let status = 500, message = "The correction could not be saved. Reload its preview before trying again.";
    if (error instanceof MuseumMoveSessionError) { status = error.status; message = error.message; }
    else if (error instanceof z.ZodError || error instanceof SyntaxError) { status = 400; message = "Check the records, report date and acknowledgements."; }
    else if (error && typeof error === "object" && "code" in error && ["P2034", "P2002"].includes(String(error.code))) { status = 409; message = "A location changed. Reload the correction preview."; }
    else if (error && typeof error === "object" && "status" in error && error.status === 413) { status = 413; message = "The correction request is too large."; }
    return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
}
