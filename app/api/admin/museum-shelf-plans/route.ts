import {NextResponse} from "next/server";
import {z} from "zod";
import {getAdminUser} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {readCompanionShelfPlans} from "@/lib/museum-companion-shelf-read";
import {parseIfNoneMatch} from "@/lib/museum-physical-progress-revision";
import {MuseumMoveSessionError} from "@/lib/museum-move-session-domain";

export const runtime="nodejs";
const headers={"Cache-Control":"private, no-store"};
export async function GET(request:Request){
 const started=performance.now();
 const user=await getAdminUser();
 if(!user?.active)return NextResponse.json({error:"Sign in to continue."},{status:401,headers});
 if(!hasCapability(user.roles,"access_museum")||!hasCapability(user.roles,"view_museum_catalog"))return NextResponse.json({error:"Museum access is required."},{status:403,headers});
 try{
  const value=new URL(request.url).searchParams.get("vitrine");
  const vitrine=value===null?undefined:z.string().trim().min(1).max(20).parse(value);
  const result=await readCompanionShelfPlans({vitrine,knownRevisions:parseIfNoneMatch(request.headers.get("if-none-match"))});
  const responseHeaders={"Cache-Control":"private, no-cache",ETag:`"${result.revision}"`,"Server-Timing":`museum;dur=${(performance.now()-started).toFixed(1)}`};
  return result.changed?NextResponse.json(result.data,{headers:responseHeaders}):new Response(null,{status:304,headers:responseHeaders});
 }catch(error){
  const status=error instanceof MuseumMoveSessionError?error.status:error instanceof z.ZodError?400:500;
  return NextResponse.json({error:error instanceof MuseumMoveSessionError?error.message:status===400?"Choose a vitrine in this museum's layout.":"Shelf plans could not be refreshed. Try again."},{status,headers});
 }
}
