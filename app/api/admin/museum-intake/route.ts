import { intakeApi, intakeJson, intakeId } from "@/lib/museum-intake-api";
import { createMuseumIntake, listMuseumIntakes } from "@/lib/museum-intake-service";
export const runtime = "nodejs";
export async function GET(request: Request) {
  return intakeApi(request, actor => {
    const search = new URL(request.url).searchParams;
    const cursor = search.get("cursor");
    return listMuseumIntakes(actor, search.get("museumId") || undefined, cursor ? intakeId.parse(cursor) : undefined, search.get("scope") === "team" ? "team" : search.get("scope") === "mine" ? "mine" : undefined);
  });
}
export async function POST(request: Request) {
  return intakeApi(request, async actor => createMuseumIntake(await intakeJson(request), actor));
}
