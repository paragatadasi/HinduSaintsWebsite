import {requireCapability} from "@/lib/admin-access";
import {readSpnTierAudit} from "@/lib/spn-tier-audit";

export const dynamic="force-dynamic";
export async function GET(){
 await requireCapability("access_museum");
 await requireCapability("view_source_data");
 await requireCapability("view_full_saint_catalog");
 const report=await readSpnTierAudit();
 return Response.json(report,{headers:{"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow","Content-Disposition":'attachment; filename="spn-tier-review.json"'}});
}
