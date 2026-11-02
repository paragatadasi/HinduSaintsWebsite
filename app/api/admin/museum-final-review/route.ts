import {physicalFingerprint} from "@/lib/museum-physical-location-current";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getAdminUser} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {intakeWriteOriginAllowed} from "@/lib/museum-intake-domain";
import {boundedIntakeBody} from "@/lib/museum-intake-api";
import {MuseumMoveSessionError} from "@/lib/museum-move-session-domain";
import {readFinalReviewHead,readFinalReviewSnapshot,saveFinalReview} from "@/lib/museum-final-review";
import {parseIfNoneMatch} from "@/lib/museum-physical-progress-revision";
export const runtime="nodejs";
const privateHeaders={"Cache-Control":"private, no-store"};
async function handle(request:Request){
 try{
  const user=await getAdminUser();
  if(!user?.active)throw new MuseumMoveSessionError(401,"Sign in to continue.");
  if(!hasCapability(user.roles,"access_museum")||!hasCapability(user.roles,"view_museum_catalog"))throw new MuseumMoveSessionError(403,"Museum access is required.");
  if(request.method==="GET"){
   const query=new URL(request.url).searchParams;
   if((query.get("museumId")??"museum-spn")!=="museum-spn")throw new MuseumMoveSessionError(400,"Choose the SPN museum.");
   const sourceId=query.get("sourceId")??undefined;if(sourceId)z.string().min(1).max(200).parse(sourceId);
   const head=await readFinalReviewHead();const tag=sourceId?physicalFingerprint({revision:head.revision,sourceId}):head.revision;
   const headers={"Cache-Control":"private, no-cache",ETag:`"${tag}"`};
   if(parseIfNoneMatch(request.headers.get("if-none-match")).includes(tag))return new Response(null,{status:304,headers});
   const data=await readFinalReviewSnapshot({sourceId,since:query.get("since")??undefined});
   return NextResponse.json(data,{headers:{...headers,ETag:`"${sourceId?physicalFingerprint({revision:data.revision,sourceId}):data.revision}"`}});
  }
  if(!hasCapability(user.roles,"manage_museum"))throw new MuseumMoveSessionError(403,"A museum curator must save final-review decisions.");
  if(!intakeWriteOriginAllowed(request.url,request.headers.get("origin"),request.headers.get("host"),process.env.NEXTAUTH_URL))throw new MuseumMoveSessionError(403,"Reload this page before saving.");
  return NextResponse.json(await saveFinalReview(JSON.parse((await boundedIntakeBody(request,32*1024)).toString("utf8")),user.id),{headers:privateHeaders});
 }catch(error){
  const status=error instanceof MuseumMoveSessionError?error.status:error instanceof z.ZodError||error instanceof SyntaxError?400:error&&typeof error==="object"&&"status" in error&&error.status===413?413:500;
  return NextResponse.json({error:error instanceof MuseumMoveSessionError?error.message:status===413?"This review is too large. Shorten the note and try again.":status===400?"Check the review fields and reload the record if necessary.":"This review could not be saved. Reload the record and try again."},{status,headers:privateHeaders});
 }
}
export const GET=handle;
export const POST=handle;
