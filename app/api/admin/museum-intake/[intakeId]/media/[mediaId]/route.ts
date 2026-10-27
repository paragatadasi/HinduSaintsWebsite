import { intakeApi, intakeId, intakeJson } from "@/lib/museum-intake-api";
import { readMuseumIntakeMedia, removeMuseumIntakeMedia } from "@/lib/museum-intake-service";
import { readIntakeImage } from "@/lib/museum-intake-storage";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ intakeId: string; mediaId: string }> }) {
  return intakeApi(request, async actor => {
    const params = await context.params;
    const photo = await readMuseumIntakeMedia(intakeId.parse(params.intakeId), intakeId.parse(params.mediaId), actor);
    const bytes = await readIntakeImage(photo.storageKey);
    return new Response(new Uint8Array(bytes), { headers: {
      "Content-Type": "image/jpeg", "Cache-Control": "private, no-store", "Vary": "Cookie",
      "X-Content-Type-Options": "nosniff", "Content-Disposition": `inline; filename="${photo.id}.jpg"`
    } });
  });
}
export async function DELETE(request: Request, context: { params: Promise<{ intakeId: string; mediaId: string }> }) {
  return intakeApi(request, async actor => {
    const params = await context.params;
    return removeMuseumIntakeMedia(intakeId.parse(params.intakeId), intakeId.parse(params.mediaId), await intakeJson(request), actor);
  });
}
