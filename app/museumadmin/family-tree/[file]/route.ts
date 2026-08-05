import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireCapability } from "@/lib/admin-access";

type FamilyTreeRouteProps = {
  params: Promise<{ file: string }>;
};

export async function GET(_request: Request, { params }: FamilyTreeRouteProps) {
  await requireCapability("access_museum");
  const { file } = await params;
  if (!/^fam-\d+-tree\.svg$/.test(file)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const treePath = path.join(process.cwd(), "data", "museum", "family-trees", file);
  if (!fs.existsSync(treePath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(fs.readFileSync(treePath, "utf8"), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
