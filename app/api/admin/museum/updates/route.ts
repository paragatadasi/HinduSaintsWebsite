import { after, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-access";
import { hasCapability } from "@/lib/permissions";
import { verifyBulkDeletePassword } from "@/lib/admin-secrets";
import { db } from "@/lib/db";
import { runMuseumUpdate, startMuseumUpdate } from "@/lib/museum-update-service";
export const runtime = "nodejs";
export const maxDuration = 300;
const headers = { "Cache-Control": "no-store" };
export async function GET() {
  const user = await getAdminUser();
  if (!user?.active || !hasCapability(user.roles,"view_source_data")) return NextResponse.json({ error: "Access denied." }, { status:403, headers });
  const jobs = await db.museumUpdateJob.findMany({ orderBy: { createdAt: "desc" }, take: 8,
    select: { id:true, status:true, progress:true, summary:true, createdAt:true, completedAt:true, leaseUntil:true } });
  return NextResponse.json({ jobs: jobs.map(job => ({ ...job, status: ["queued","running"].includes(job.status) && job.leaseUntil < new Date() ? "interrupted" : job.status })) }, { headers });
}
export async function POST(request: Request) {
  const trustedOrigin = new URL(process.env.PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || request.url).origin;
  if (request.headers.get("origin") !== trustedOrigin) return NextResponse.json({ error:"Invalid request origin." }, { status:403, headers });
  const user = await getAdminUser();
  if (!user?.active || !hasCapability(user.roles,"view_source_data") || !hasCapability(user.roles,"run_imports")) return NextResponse.json({ error:"Import permission required." }, { status:403, headers });
  const text = await request.text();
  if (text.length > 4096) return NextResponse.json({ error:"Request too large." },{ status:413, headers });
  const parsed = z.object({ password:z.string().min(1).max(256) }).safeParse(await Promise.resolve().then(() => JSON.parse(text || "{}")).catch(() => null));
  if (!parsed.success || !await verifyBulkDeletePassword(parsed.data.password)) return NextResponse.json({ error:"Enter the correct sensitive-action password." },{ status:400, headers });
  try {
    const { job, started } = await startMuseumUpdate(user.id);
    if (started) after(() => runMuseumUpdate(job.id));
    return NextResponse.json({ jobId:job.id, started },{ status:202, headers });
  } catch {
    return NextResponse.json({ error:"Could not start. Check the server SPN Website Airtable credentials and ensure no view filter is configured." },{ status:400, headers });
  }
}
