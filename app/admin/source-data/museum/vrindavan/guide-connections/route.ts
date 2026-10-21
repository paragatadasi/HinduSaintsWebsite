import {requireCapability} from "@/lib/admin-access";
import {readVrindavanGuideConnections} from "@/lib/vrindavan-guide-connections";
export const dynamic="force-dynamic";
export async function GET(){
 await requireCapability("access_museum");await requireCapability("view_full_saint_catalog");
 const report=await readVrindavanGuideConnections();
 return Response.json(report,{headers:{"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow","Content-Disposition":'attachment; filename="vrindavan-guide-connection-alignment.json"'}});
}
