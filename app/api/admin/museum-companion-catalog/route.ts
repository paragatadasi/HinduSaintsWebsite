import {NextResponse} from "next/server";
import {z} from "zod";
import {getAdminUser} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {intakeWriteOriginAllowed,MuseumIntakeError} from "@/lib/museum-intake-domain";
import {boundedIntakeBody} from "@/lib/museum-intake-api";
import {MuseumMoveSessionError} from "@/lib/museum-move-session-domain";
import {readCompanionCatalog} from "@/lib/museum-companion-catalog";
import {saveCompanionAddition} from "@/lib/museum-companion-additions";
const headers={"Cache-Control":"private, no-store"};
async function handle(request:Request){
 try{
  const user=await getAdminUser();
  if(!user?.active)throw new MuseumMoveSessionError(401,"Sign in to continue.");
  if(!hasCapability(user.roles,"access_museum")||!hasCapability(user.roles,"view_museum_catalog"))throw new MuseumMoveSessionError(403,"Museum access is required.");
  if(request.method==="GET")return NextResponse.json(await readCompanionCatalog(),{headers});
  if(!hasCapability(user.roles,"manage_museum"))throw new MuseumMoveSessionError(403,"A curator must plan destinations.");
  if(!intakeWriteOriginAllowed(request.url,request.headers.get("origin"),request.headers.get("host"),process.env.AUTH_URL||process.env.NEXTAUTH_URL))throw new MuseumMoveSessionError(403,"Reload this page before saving.");
  if(!request.headers.get("content-type")?.startsWith("application/json"))throw new MuseumMoveSessionError(415,"Send this change as JSON.");
  const raw=JSON.parse((await boundedIntakeBody(request,8192)).toString("utf8"));
  return NextResponse.json({addition:await saveCompanionAddition(raw,user.id)},{headers});
 }catch(error){
  const conflict=error&&typeof error==="object"&&"code" in error&&["P2034","P2002"].includes(String(error.code));
  const status=conflict?409:error instanceof MuseumMoveSessionError||error instanceof MuseumIntakeError?error.status:error instanceof z.ZodError||error instanceof SyntaxError?400:500;
  return NextResponse.json({error:error instanceof MuseumMoveSessionError||error instanceof MuseumIntakeError?error.message:conflict?"Another curator changed this record. Reload it before saving.":status===400?"Check the destination and reload the record.":"The change could not be confirmed. Retry to check whether it saved."},{status,headers});
 }
}
export const GET=handle;export const POST=handle;
