import {requireCapability} from "@/lib/admin-access";
import companion from "@/data/museum/spn-pilgrimage-final-v10.json";
export const dynamic="force-dynamic";
export async function GET(){
 await requireCapability("access_museum");await requireCapability("view_museum_catalog");
 return new Response(companion.html,{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow","Content-Security-Policy":"sandbox allow-scripts; frame-ancestors 'self'; connect-src 'none'; form-action 'none'","Referrer-Policy":"no-referrer"}});
}
