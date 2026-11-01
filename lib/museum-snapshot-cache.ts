import { randomUUID } from "node:crypto";
import { db } from "./db";
import { Prisma } from "./generated/prisma/client";

// Code and data/*.json change only on deploy, so a new process never reuses an earlier key.
const processEpoch = randomUUID();
const KEPT_REVISIONS = 2;
const entries = new Map<string, Map<string, Promise<unknown>>>();

type RevisionState = { revision: string; snapshotConsistent: boolean; transactionWrote: boolean };

// One round trip: the counter, whether this statement's snapshot covers the whole transaction
// (REPEATABLE READ or SERIALIZABLE), and whether this transaction has written anything yet.
async function readRevisionState(client: Prisma.TransactionClient): Promise<RevisionState> {
  const [row] = await client.$queryRaw<{ revision: bigint; isolation: string; wrote: boolean }[]>`
    SELECT "revision", current_setting('transaction_isolation') AS isolation,
           pg_current_xact_id_if_assigned() IS NOT NULL AS wrote
      FROM "MuseumDataRevision" WHERE "id" = 1`;
  if (!row) throw new Error("MuseumDataRevision is missing. Apply the museum_data_revision migration.");
  return { revision: row.revision.toString(), snapshotConsistent: row.isolation === "repeatable read" || row.isolation === "serializable", transactionWrote: row.wrote };
}

export async function readMuseumRevision(client: Prisma.TransactionClient = db) {
  return (await readRevisionState(client)).revision;
}

/**
 * Returns `build(client)` shared across requests while the museum data revision is unchanged.
 *
 * Correctness rules:
 * - The revision is read before the build, in the same transaction, so a cached value is never older than its key.
 * - A transaction that has already written bypasses the cache: its own changes only move the counter at commit.
 * - Only builds whose revision and data come from one snapshot (REPEATABLE READ) are stored. A plain `db`
 *   caller builds inside its own REPEATABLE READ transaction so that it can populate the cache too.
 * - Failures are never cached; a caller sharing a failed build retries with its own client.
 * - Results are shared: callers must not mutate them. Outside production they are deep-frozen so a mutation throws.
 */
export async function cachedByMuseumRevision<T>(name: string, variant: string, client: Prisma.TransactionClient,
  build: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  // Test doubles without raw SQL keep the uncached behaviour.
  if (typeof (client as { $queryRaw?: unknown }).$queryRaw !== "function") return build(client);
  if (client === db) {
    return db.$transaction(tx => cachedByMuseumRevision(name, variant, tx, build),
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 60000, maxWait: 10000 });
  }
  const state = await readRevisionState(client);
  if (state.transactionWrote) return build(client);
  const key = `${processEpoch}:${state.revision}:${variant}`;
  const byKey = entries.get(name) ?? new Map<string, Promise<unknown>>();
  entries.set(name, byKey);
  const hit = byKey.get(key) as Promise<T> | undefined;
  if (hit) return hit.catch(() => build(client));
  if (!state.snapshotConsistent) return build(client);
  const value = build(client).then(result => process.env.NODE_ENV === "production" ? result : deepFreeze(result));
  byKey.set(key, value);
  while (byKey.size > KEPT_REVISIONS) byKey.delete(byKey.keys().next().value!);
  value.catch(() => { if (byKey.get(key) === value) byKey.delete(key); });
  return value;
}

export function clearMuseumSnapshotCache() {
  entries.clear();
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as object)) deepFreeze(child);
  }
  return value;
}
