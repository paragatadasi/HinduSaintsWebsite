import { z } from "zod";
import { db } from "@/lib/db";
import { boundedIntakeBody, intakeApi } from "@/lib/museum-intake-api";
import { MuseumIntakeError } from "@/lib/museum-intake-domain";
import { MuseumMoveSessionError } from "@/lib/museum-move-session-domain";
import { physicalFingerprint } from "@/lib/museum-physical-location-current";
import { readShufflePlacement, saveShufflePlacement, shufflePhysicalActionIds } from "@/lib/museum-shuffle-placement";
import { retryMuseumSerialization } from "@/lib/museum-write-concurrency";
import { hasCapability } from "@/lib/permissions";
import { shuffleActions, shuffleGuideId } from "@/lib/spn-shuffle-guide";

export const runtime = "nodejs";

const actionIds = new Set<string>(shuffleActions.map(action => action.id));
const physicalActionIds = new Set(shufflePhysicalActionIds);
const selection = { actionId: true, completed: true, version: true, physicalReceiptId: true } as const;
type ActionState = { actionId: string; completed: boolean; version: number; physicalReceiptId: string | null };

const inputSchema = z.object({
  actionId: z.string().max(200).refine(id => actionIds.has(id)),
  completed: z.boolean(),
  expectedVersion: z.number().int().min(0).max(2147483646),
  clientRequestId: z.string().min(1).max(128),
  physicalConfirmation: z.object({
    revision: z.string().regex(/^[a-f0-9]{64}$/),
    confirmedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }).strict().optional()
}).strict();

function publicState({ actionId, completed, version, physicalReceiptId }: ActionState) {
  return { actionId, completed, version, ...(physicalReceiptId ? { physicalReceiptId } : {}) };
}

function rethrowPlacementError(cause: unknown): never {
  if (cause instanceof MuseumMoveSessionError) throw new MuseumIntakeError(cause.status, cause.message);
  throw cause;
}

export async function GET(request: Request) {
  return intakeApi(request, async actor => {
    if (!hasCapability(actor.roles, "view_museum_catalog")) throw new MuseumIntakeError(403, "Museum catalog access is required.");

    const actionId = new URL(request.url).searchParams.get("actionId");
    if (actionId !== null) {
      if (!actor.canReview) throw new MuseumIntakeError(403, "Museum editing access is required.");
      try {
        return { physical: await readShufflePlacement(actionId) };
      } catch (cause) {
        rethrowPlacementError(cause);
      }
    }

    const actions = await db.$queryRaw<ActionState[]>`
      SELECT DISTINCT ON ("actionId") "actionId", "completed", "version", "physicalReceiptId"
      FROM "MuseumShuffleGuideActionRevision"
      WHERE "guideId" = ${shuffleGuideId}
      ORDER BY "actionId", "version" DESC
    `;
    return {
      actions: actions.filter(action => actionIds.has(action.actionId)).map(publicState),
      canEdit: actor.canReview,
      physicalActionIds: shufflePhysicalActionIds
    };
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
    const scope = { guideId: shuffleGuideId, actionId: input.actionId };
    const physical = input.physicalConfirmation;
    const fingerprint = physical ? physicalFingerprint(physical) : null;

    function replay(receipt: ActionState & { updatedById: string; guideId: string; physicalRequestFingerprint: string | null }) {
      if (receipt.updatedById !== actor.id || receipt.guideId !== scope.guideId || receipt.actionId !== scope.actionId ||
        receipt.version !== input.expectedVersion + 1 || receipt.completed !== input.completed ||
        receipt.physicalRequestFingerprint !== fingerprint) {
        throw new MuseumIntakeError(409, "This save ID was already used. Reload the guide before trying again.");
      }
      return { action: publicState(receipt) };
    }

    try {
      return await retryMuseumSerialization(() => db.$transaction(async tx => {
        const revisions = tx.museumShuffleGuideActionRevision;
        const prior = await revisions.findUnique({ where: { clientRequestId: input.clientRequestId } });
        if (prior) return replay(prior);

        const current = await revisions.findFirst({ where: scope, orderBy: { version: "desc" }, select: selection });
        if ((current?.version ?? 0) !== input.expectedVersion) {
          throw new MuseumIntakeError(409, "This checkbox changed. Reload the guide to see its latest state.");
        }

        const needsPlacement = input.completed && physicalActionIds.has(input.actionId);
        if (needsPlacement !== Boolean(physical)) {
          throw new MuseumIntakeError(400, needsPlacement
            ? "Review and confirm the physical transfer before checking this line."
            : "This checkbox change cannot record a physical transfer.");
        }
        const physicalReceiptId = physical
          ? await saveShufflePlacement(tx, { ...input, clientRequestId: z.string().uuid().parse(input.clientRequestId), physicalConfirmation: physical }, actor.id)
          : null;

        const action = await revisions.create({
          data: { ...scope, completed: input.completed, version: input.expectedVersion + 1,
            clientRequestId: input.clientRequestId, updatedById: actor.id, physicalReceiptId, physicalRequestFingerprint: fingerprint },
          select: selection
        });
        return { action: publicState(action) };
      }, { isolationLevel: "Serializable", timeout: 60_000 }));
    } catch (cause) {
      if (cause && typeof cause === "object" && "code" in cause && cause.code === "P2002") {
        const prior = await db.museumShuffleGuideActionRevision.findUnique({ where: { clientRequestId: input.clientRequestId } });
        if (prior) return replay(prior);
      }
      rethrowPlacementError(cause);
    }
  });
}
