import {redirect} from "next/navigation";
import type {Route} from "next";
import {requireCapability} from "@/lib/admin-access";
import {museumOverviewHref,type MuseumOverviewParams} from "@/lib/museum-overview";
export default async function LegacyMuseumView({searchParams}:{searchParams:Promise<MuseumOverviewParams>}) {
 await requireCapability("access_museum");
 redirect(museumOverviewHref(await searchParams,"layout") as Route);
}
