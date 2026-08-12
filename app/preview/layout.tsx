import type { Metadata } from "next";
import { requireDevelopmentExperienceViewer } from "@/lib/development-experiences";
import { PRIVATE_ROBOTS } from "@/lib/private-robots";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: PRIVATE_ROBOTS
};

export default async function PreviewLayout({ children }: { children: React.ReactNode }) {
  await requireDevelopmentExperienceViewer();
  return children;
}
