import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createInstagramRefreshJob, runInstagramIngestionJob } from "@/lib/instagram-ingestion";

export const runtime = "nodejs";

const runningStatuses = ["queued", "running"];
const cronCreatedByEmail = "instagram-refresh-cron@hindu-saints.local";

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeJob = await db.instagramIngestionJob.findFirst({
    where: { status: { in: runningStatuses } },
    orderBy: { createdAt: "desc" }
  });

  if (activeJob) {
    return NextResponse.json({
      job: activeJob,
      skipped: true,
      message: "An Instagram ingestion job is already running."
    }, { status: 200 });
  }

  try {
    const job = await createInstagramRefreshJob({ createdByEmail: cronCreatedByEmail });

    setTimeout(() => {
      runInstagramIngestionJob(job.id).catch((error) => {
        console.error("Scheduled Instagram refresh failed", error);
      });
    }, 0);

    return NextResponse.json({ job, skipped: false }, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start scheduled Instagram refresh." },
      { status: 400 }
    );
  }
}

function isAuthorizedCronRequest(request: Request) {
  const expectedSecret = process.env.INSTAGRAM_REFRESH_CRON_SECRET;
  if (!expectedSecret) return false;

  const authorization = request.headers.get("authorization");
  const bearerSecret = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : undefined;
  const providedSecret = request.headers.get("x-cron-secret") ?? bearerSecret;
  if (!providedSecret) return false;

  return timingSafeStringEqual(providedSecret, expectedSecret);
}

function timingSafeStringEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}
