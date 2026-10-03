import {requireCapability} from "@/lib/admin-access";
import {readVrindavanInventoryReadiness} from "@/lib/vrindavan-inventory-readiness";
export const dynamic="force-dynamic";
export async function GET(request:Request) {
 await requireCapability("access_museum");await requireCapability("view_full_saint_catalog");
 const snapshotHash=new URL(request.url).searchParams.get("snapshot")??undefined;
 if(snapshotHash&&!/^[a-f0-9]{64}$/.test(snapshotHash))return Response.json({error:"Invalid snapshot"},{status:400,headers:{"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow"}});
 const report=await readVrindavanInventoryReadiness({snapshotHash});
 return Response.json(report,{headers:{"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow","Content-Disposition":'attachment; filename="vrindavan-inventory-readiness.json"'}});
}
