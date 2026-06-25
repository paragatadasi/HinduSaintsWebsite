import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createAirtableImportJob, runAirtableImportJob } from "@/lib/airtable-saint-import";
import { serializeAirtableImportJob } from "@/lib/airtable-import-job-view";
import { db } from "@/lib/db";

const runningStatuses = ["queued", "running"];
const airtableImportIntentSchema = z.enum(["check", "import_missing_drafts", "import_guru_relationships"]);

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobs = await getRecentJobs();
  return NextResponse.json({ jobs });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { intent?: string };
  const parsedIntent = airtableImportIntentSchema.safeParse(body.intent);
  if (!parsedIntent.success) {
    return NextResponse.json({ error: "Invalid Airtable import intent." }, { status: 400 });
  }

  const intent = parsedIntent.data;
  const activeJob = await db.airtableImportJob.findFirst({
    where: { status: { in: runningStatuses } },
    orderBy: { createdAt: "desc" }
  });

  if (activeJob) {
    return NextResponse.json({ error: "An Airtable import job is already running.", job: activeJob }, { status: 409 });
  }

  try {
    const job = await createAirtableImportJob({
      createdByEmail: session.user.email,
      mode: intent
    });

    setTimeout(() => {
      runAirtableImportJob(job.id).catch((error) => {
        console.error("Airtable import job failed", error);
      });
    }, 0);

    return NextResponse.json({ job }, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start Airtable import." },
      { status: 400 }
    );
  }
}

function getRecentJobs() {
  return db.airtableImportJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 8
  }).then((jobs) => jobs.map(serializeAirtableImportJob));
}
