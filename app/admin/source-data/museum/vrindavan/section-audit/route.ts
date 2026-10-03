import {requireCapability} from "@/lib/admin-access";
import {readVrindavanSectionProposalAudit} from "@/lib/vrindavan-section-proposals";
export const dynamic="force-dynamic";
export async function GET(request:Request) {
 await requireCapability("access_museum");await requireCapability("view_full_saint_catalog");
 const snapshotHash=new URL(request.url).searchParams.get("snapshot")??undefined;
 if(snapshotHash&&!/^[a-f0-9]{64}$/.test(snapshotHash))return new Response("Invalid snapshot",{status:400});
 const report=await readVrindavanSectionProposalAudit({snapshotHash});
 return Response.json(report,{headers:{"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow","Content-Disposition":'attachment; filename="vrindavan-section-place-audit.json"'}});
}