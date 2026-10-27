import { intakeApi, intakeId, intakeJson } from "@/lib/museum-intake-api";
import { submitMuseumIntake } from "@/lib/museum-intake-service";
export async function POST(request: Request, context: { params: Promise<{ intakeId: string }> }) {
  return intakeApi(request, async actor => submitMuseumIntake(intakeId.parse((await context.params).intakeId), await intakeJson(request), actor));
}
