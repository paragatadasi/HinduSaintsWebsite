import { intakeApi, intakeId, intakeJson } from "@/lib/museum-intake-api";
import { reviewMuseumIntake } from "@/lib/museum-intake-service";
export async function POST(request: Request, context: { params: Promise<{ intakeId: string }> }) {
  return intakeApi(request, async actor => reviewMuseumIntake(intakeId.parse((await context.params).intakeId), await intakeJson(request), actor));
}
