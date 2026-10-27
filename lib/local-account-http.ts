import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "./admin-access";
import { boundedIntakeBody } from "./museum-intake-api";
import { intakeWriteOriginAllowed } from "./museum-intake-domain";
import { LocalAccountError } from "./local-password";

export async function localAccountHttp(request: Request, adminOnly: boolean, operation: (body: unknown, actorId: string) => Promise<unknown>) {
  try {
    if (!intakeWriteOriginAllowed(request.url, request.headers.get("origin"), request.headers.get("host"), process.env.AUTH_URL || process.env.NEXTAUTH_URL)) throw new LocalAccountError(403, "Reload this page before continuing.");
    let actorId = "";
    if (adminOnly) {
      const actor = await getAdminUser();
      if (!actor?.active) throw new LocalAccountError(401, "Sign in to continue.");
      if (!actor.roles.includes("site_admin")) throw new LocalAccountError(403, "Site Admin access is required.");
      actorId = actor.id;
    }
    if (!request.headers.get("content-type")?.startsWith("application/json")) throw new LocalAccountError(415, "Send the form as JSON.");
    const body = JSON.parse((await boundedIntakeBody(request, 16 * 1024)).toString("utf8")) as unknown;
    const result = await operation(body, actorId);
    return result instanceof Response ? result : NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    let status = 500, message = "This request could not be completed. Please try again.";
    let fieldErrors: Record<string, string> | undefined;
    if (error instanceof LocalAccountError) { status = error.status; message = error.message; }
    else if (error instanceof z.ZodError) {
      status = 400; message = "Check the form fields.";
      fieldErrors = Object.fromEntries(error.issues.filter(issue => issue.path.length).map(issue => [String(issue.path[0]), issue.message]));
    } else if (error instanceof SyntaxError) { status = 400; message = "The form could not be read. Try again."; }
    else if (error && typeof error === "object" && "code" in error && error.code === "P2002") { status = 409; message = "That username is already in use."; fieldErrors = { username: message }; }
    else if (error && typeof error === "object" && "status" in error && error.status === 413) { status = 413; message = "This form is too large."; }
    return NextResponse.json({ error: message, ...(fieldErrors ? { fieldErrors } : {}) }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
}
