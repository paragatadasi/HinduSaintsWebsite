import {requireCapability} from "@/lib/admin-access";
import {readVrindavanCurrentState} from "@/lib/vrindavan-current-state";
export const dynamic="force-dynamic";
export async function GET(){
 await requireCapability("access_museum");await requireCapability("view_full_saint_catalog");
 const report=await readVrindavanCurrentState();
 return Response.json(report,{headers:{"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow","Content-Disposition":'attachment; filename="vrindavan-current-proposals-and-families.json"'}});
}
