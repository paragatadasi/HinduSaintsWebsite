import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { boundedIntakeBody, intakeApi } from "@/lib/museum-intake-api";
import { MuseumIntakeError } from "@/lib/museum-intake-domain";
import { hasCapability } from "@/lib/permissions";
import { shuffleActions, shuffleGuideId } from "@/lib/spn-shuffle-guide";

export const runtime = "nodejs";

const actionIds = new Set<string>(shuffleActions.map(action => action.id));
const headers = { "Cache-Control": "private, no-store" };
const selection = { actionId: true, completed: true, version: true } as const;
type ActionState = { actionId: string; completed: boolean; version: number };

const inputSchema = z.object({
  actionId: z.string().max(200).refine(id => actionIds.has(id)),
  completed: z.boolean(),
  expectedVersion: z.number().int().min(0).max(2147483646),
  clientRequestId: z.string().min(1).max(128)
});

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers });
}

export async function GET(request: Request) {
  return intakeApi(request, async actor => {
    if (!hasCapability(actor.roles, "view_museum_catalog")) return error("Museum catalog access is required.", 403);

    const actions = await db.$queryRaw<ActionState[]>`
      SELECT DISTINCT ON ("actionId") "actionId", "completed", "version"
      FROM "MuseumShuffleGuideActionRevision"
      WHERE "guideId" = ${shuffleGuideId}
      ORDER BY "actionId", "version" DESC
    `;
    return { actions: actions.filter(action => actionIds.has(action.actionId)), canEdit: actor.canReview };
  });
}

export async function POST(request: Request) {
  return intakeApi(request, async actor => {
    if (!hasCapability(actor.roles, "view_museum_catalog") || !actor.canReview) {
      throw new MuseumIntakeError(403, "Museum editing access is required.");
    }
    if (!request.headers.get("content-type")?.startsWith("application/json")) {
      throw new MuseumIntakeError(415, "Send this change as JSON.");
    }

    const input = inputSchema.parse(JSON.parse((await boundedIntakeBody(request, 4096)).toString("utf8")));
    const revisions = db.museumShuffleGuideActionRevision;
    const scope = { guideId: shuffleGuideId, actionId: input.actionId };

    async function replay() {
      const receipt = await revisions.findUnique({ where: { clientRequestId: input.clientRequestId } });
      if (!receipt) return null;
      if (receipt.updatedById !== actor.id || receipt.guideId !== scope.guideId || receipt.actionId !== scope.actionId ||
        receipt.version !== input.expectedVersion + 1 || receipt.completed !== input.completed) {
        return error("This save ID was already used. Reload the guide before trying again.", 409);
      }
      const { actionId, completed, version } = receipt;
      return NextResponse.json({ action: { actionId, completed, version } }, { headers });
    }

    const priorResponse = await replay();
    if (priorResponse) return priorResponse;

    const current = await revisions.findFirst({ where: scope, orderBy: { version: "desc" }, select: selection });
    if ((current?.version ?? 0) === input.expectedVersion) {
      try {
        const action = await revisions.create({
          data: { ...scope, completed: input.completed, version: input.expectedVersion + 1, clientRequestId: input.clientRequestId, updatedById: actor.id },
          select: selection
        });
        return NextResponse.json({ action }, { headers });
      } catch (cause) {
        if (!cause || typeof cause !== "object" || !("code" in cause) || cause.code !== "P2002") throw cause;
      }
    }

    return await replay() ?? error("This checkbox changed. Reload the guide to see its latest state.", 409);
  });
}
