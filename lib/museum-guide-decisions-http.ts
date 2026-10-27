import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "./admin-access";
import { hasCapability } from "./permissions";
import { boundedIntakeBody } from "./museum-intake-api";
import { intakeWriteOriginAllowed } from "./museum-intake-domain";
import { MuseumMoveSessionError } from "./museum-move-session-domain";
import { readMuseumGuideDecisions, saveMuseumGuideDecision } from "./museum-guide-decisions";
import { readStarterGuideDefinition, starterGuideContext } from "./spn-starter-guide-registry";

export async function museumGuideDecisionsHttp(request: Request) {
  try {
    const user = await getAdminUser();
    if (!user?.active) throw new MuseumMoveSessionError(401, "Sign in to continue.");
    if (!hasCapability(user.roles, "access_museum") || !hasCapability(user.roles, "view_museum_catalog")) throw new MuseumMoveSessionError(403, "Museum catalog access is required.");
    let result;
    if (request.method === "GET") {
      const query = new URL(request.url).searchParams;
      if ((query.get("museumId") ?? "museum-spn") !== "museum-spn") throw new MuseumMoveSessionError(400, "Choose the SPN museum.");
      result = await readMuseumGuideDecisions(z.string().min(1).max(200).parse(query.get("guideVersion") ?? starterGuideContext.guideVersion), readStarterGuideDefinition);
    } else if (request.method === "POST") {
      if (!hasCapability(user.roles, "manage_museum")) throw new MuseumMoveSessionError(403, "A museum curator must review suggestions.");
      if (!intakeWriteOriginAllowed(request.url, request.headers.get("origin"), request.headers.get("host"), process.env.AUTH_URL || process.env.NEXTAUTH_URL)) throw new MuseumMoveSessionError(403, "Reload this guide before saving a decision.");
      if (!request.headers.get("content-type")?.startsWith("application/json")) throw new MuseumMoveSessionError(415, "Send this decision as JSON.");
      result = await saveMuseumGuideDecision(JSON.parse((await boundedIntakeBody(request, 16 * 1024)).toString("utf8")), { id: user.id, canManage: true }, readStarterGuideDefinition);
    } else throw new MuseumMoveSessionError(405, "This action is unavailable.");
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    let status = 500, message = "This decision could not be saved. Reload the guide before trying again.";
    if (error instanceof MuseumMoveSessionError) { status = error.status; message = error.message; }
    else if (error instanceof z.ZodError || error instanceof SyntaxError) { status = 400; message = "Check the suggestion and guide version before saving."; }
    else if (error && typeof error === "object" && "code" in error && ["P2034", "P2002"].includes(String(error.code))) { status = 409; message = "This suggestion changed. Reload its latest decision."; }
    else if (error && typeof error === "object" && "status" in error && error.status === 413) { status = 413; message = "Shorten the decision note before saving."; }
    return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
}
