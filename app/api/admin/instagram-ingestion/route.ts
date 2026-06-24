import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createInstagramIncompleteRepairJob,
  createInstagramRefreshJob,
  getIncompleteInstagramItemWhere,
  getIncompleteInstagramItemSummaries,
  runInstagramIngestionJob
} from "@/lib/instagram-ingestion";

const runningStatuses = ["queued", "running"];
const incompleteItemLimit = 50;

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [jobs, incompleteCount, incompleteItems] = await Promise.all([
    getRecentJobs(),
    getIncompleteCount(),
    getIncompleteInstagramItemSummaries(incompleteItemLimit)
  ]);

  return NextResponse.json({ jobs, incompleteCount, incompleteItems });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { intent?: string };
  const intent = body.intent === "repair_incomplete" ? "repair_incomplete" : "refresh";
  const activeJob = await db.instagramIngestionJob.findFirst({
    where: { status: { in: runningStatuses } },
    orderBy: { createdAt: "desc" }
  });

  if (activeJob) {
    return NextResponse.json({ error: "An Instagram ingestion job is already running.", job: activeJob }, { status: 409 });
  }

  try {
    const job = intent === "repair_incomplete"
      ? await createInstagramIncompleteRepairJob({ createdByEmail: session.user.email })
      : await createInstagramRefreshJob({ createdByEmail: session.user.email });

    setTimeout(() => {
      runInstagramIngestionJob(job.id).catch((error) => {
        console.error("Instagram ingestion job failed", error);
      });
    }, 0);

    return NextResponse.json({ job }, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start Instagram ingestion." },
      { status: 400 }
    );
  }
}

function getRecentJobs() {
  return db.instagramIngestionJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 8
  });
}

function getIncompleteCount() {
  return db.instagramItem.count({
    where: getIncompleteInstagramItemWhere()
  });
}
