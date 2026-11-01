import {Prisma} from "./generated/prisma/client";
import {MuseumMoveSessionError} from "./museum-move-session-domain";

export async function lockMuseumPlacement(tx: Prisma.TransactionClient, requestId: string, sourceIds: string[], exclusive = false) {
  // Clearing, undo and session writes still take the exclusive side of this barrier.
  if (exclusive) await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock(hashtext('museum-move-session:spn'))`;
  else await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock_shared(hashtext('museum-move-session:spn'))`;
  await tx.$queryRaw(Prisma.sql`SELECT true FROM pg_advisory_xact_lock(hashtextextended(${"museum-placement-request:spn:" + requestId},0))`);
  for (const sourceId of [...new Set(sourceIds)].sort()) {
    await tx.$queryRaw(Prisma.sql`SELECT true FROM pg_advisory_xact_lock(hashtextextended(${"museum-physical-source:spn:" + sourceId},0))`);
  }
}

export async function retryMuseumSerialization<T>(write: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await write(); }
    catch (error) {
      if (!isMuseumSerializationConflict(error)) throw error;
      if (attempt >= 4) throw new MuseumMoveSessionError(409, "This record changed while saving. Reload its current state before trying again.");
      // Restart outside the rolled-back transaction, without keeping any locks.
      // Stagger users so they do not repeatedly collide on the same retry wave.
      await new Promise(resolve => setTimeout(resolve, 50 * 2 ** attempt + Math.floor(Math.random() * 50)));
    }
  }
}

function isMuseumSerializationConflict(error: unknown) {
  if (!error || typeof error !== "object") return false;
  if ("code" in error && error.code === "P2034") return true;
  if ("code" in error && error.code === "P2010" && "meta" in error && error.meta && typeof error.meta === "object" &&
      "driverAdapterError" in error.meta) return adapterSerializationConflict(error.meta.driverAdapterError);
  return adapterSerializationConflict(error);
}

function adapterSerializationConflict(error: unknown) {
  if (!error || typeof error !== "object") return false;
  // Prisma's pg adapter can surface a commit-time conflict without wrapping P2034.
  if (!("cause" in error) || !error.cause || typeof error.cause !== "object") return false;
  return "originalCode" in error.cause && error.cause.originalCode === "40001" &&
    "kind" in error.cause && error.cause.kind === "TransactionWriteConflict";
}
