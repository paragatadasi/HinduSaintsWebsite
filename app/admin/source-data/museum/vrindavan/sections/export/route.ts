import {requireCapability} from "@/lib/admin-access";
import {readVrindavanLineageReview} from "@/lib/vrindavan-lineage-review";
export const dynamic="force-dynamic";
export async function GET(){await requireCapability("view_source_data");await requireCapability("access_museum");await requireCapability("view_full_saint_catalog");return Response.json(await readVrindavanLineageReview(),{headers:{"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow","Content-Disposition":'attachment; filename="vrindavan-lineage-before-after.json"'}});}
