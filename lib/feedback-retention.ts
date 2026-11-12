import { db } from "@/lib/db";

const cleanupIntervalMs = 60 * 60 * 1000;
const retentionState = globalThis as typeof globalThis & {
  feedbackRetentionTimer?: ReturnType<typeof setTimeout>;
};

export async function purgeExpiredFeedback() {
  return db.$transaction(async (tx) => {
    const deleted = await tx.$queryRaw<{ id: string }[]>`
      DELETE FROM "FeedbackSubmission"
      WHERE "createdAt" + INTERVAL '1 year' <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      RETURNING "id"
    `;

    if (deleted.length > 0) {
      // Delete audit snapshots after locking and deleting the submissions, so a
      // concurrent inbox update cannot leave a copy of a resolution note behind.
      await tx.auditEvent.deleteMany({
        where: {
          entityType: "FeedbackSubmission",
          entityId: { in: deleted.map(({ id }) => id) }
        }
      });
    }

    return deleted.length;
  });
}

export function startFeedbackRetention() {
  if (retentionState.feedbackRetentionTimer) return;

  async function runCleanup() {
    try {
      await purgeExpiredFeedback();
    } catch (error) {
      console.error("Unable to purge expired feedback.", error);
    } finally {
      retentionState.feedbackRetentionTimer = setTimeout(runCleanup, cleanupIntervalMs).unref();
    }
  }

  retentionState.feedbackRetentionTimer = setTimeout(runCleanup, 0).unref();
}
