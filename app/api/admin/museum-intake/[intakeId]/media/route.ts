import { z } from "zod";
import { intakeApi, intakeId, boundedIntakeBody } from "@/lib/museum-intake-api";
import { intakeMediaKind, intakeRelicId, MuseumIntakeError } from "@/lib/museum-intake-domain";
import { addMuseumIntakeMedia } from "@/lib/museum-intake-service";
export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ intakeId: string }> }) {
  return intakeApi(request, async actor => {
    const type = request.headers.get("content-type");
    if (!type?.startsWith("multipart/form-data;")) throw new MuseumIntakeError(415, "Upload a photo using the form.");
    const body = await boundedIntakeBody(request, 11 * 1024 * 1024);
    let form: FormData;
    try { form = await new Response(new Uint8Array(body), { headers: { "Content-Type": type } }).formData(); }
    catch { throw new MuseumIntakeError(400, "The photo upload could not be read. Choose it again."); }
    const file = form.get("file");
    if (!(file instanceof File)) throw new MuseumIntakeError(400, "Choose a photo.");
    const version = z.coerce.number().int().positive().parse(form.get("expectedVersion"));
    return addMuseumIntakeMedia(intakeId.parse((await context.params).intakeId), version, intakeMediaKind.parse(form.get("kind")), file, actor, form.get("relicId") ? intakeRelicId.parse(form.get("relicId")) : undefined);
  });
}
