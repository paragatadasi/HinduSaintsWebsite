import { intakeApi, intakeId, intakeJson } from "@/lib/museum-intake-api";
import { readMuseumIntake, editMuseumIntake } from "@/lib/museum-intake-service";
type Context = { params: Promise<{ intakeId: string }> };
export async function GET(request: Request, context: Context) {
  return intakeApi(request, async actor => readMuseumIntake(intakeId.parse((await context.params).intakeId), actor));
}
export async function PATCH(request: Request, context: Context) {
  return intakeApi(request, async actor => editMuseumIntake(intakeId.parse((await context.params).intakeId), await intakeJson(request), actor));
}
