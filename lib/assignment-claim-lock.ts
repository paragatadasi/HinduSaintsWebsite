import type { Prisma } from "@/lib/generated/prisma/client";

export async function acquireAssignmentClaimLock(
  tx: Prisma.TransactionClient,
  userId: string
) {
  // PostgreSQL returns `void` from pg_advisory_xact_lock. Prisma's query path
  // attempts to deserialize that value and fails; the execute path discards it.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
}
