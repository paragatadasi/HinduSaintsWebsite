import {NextResponse} from "next/server";
import {z} from "zod";
import {getAdminUser} from "@/lib/admin-access";
import {hasCapability} from "@/lib/permissions";
import {readMuseumLiveTree} from "@/lib/museum-live-tree";
export const dynamic="force-dynamic";
const input=z.object({museum:z.enum(["spn","vrindavan"]),seeds:z.array(z.string().min(1).max(100)).max(60),familyKey:z.string().min(1).max(300).optional(),includeSource:z.boolean().default(false),includeUnreviewed:z.boolean().default(false)}).strict().refine(value=>value.seeds.length>0||Boolean(value.familyKey),{message:"Choose a saint or family."});
const headers={"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow"};
export async function POST(request:Request){
 const user=await getAdminUser();
 if(!user?.active)return NextResponse.json({error:"Please sign in again."},{status:401,headers});
 if(!hasCapability(user.roles,"access_museum")||!hasCapability(user.roles,"view_full_saint_catalog"))return NextResponse.json({error:"Museum and full catalogue access are required."},{status:403,headers});
 const parsed=input.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Choose up to 60 linked saints and a valid museum."},{status:400,headers});
 try{return NextResponse.json(await readMuseumLiveTree([...new Set(parsed.data.seeds)],parsed.data.museum,parsed.data.includeUnreviewed,parsed.data.familyKey,parsed.data.includeSource),{headers});}
 catch(error){console.error("Museum relationship tree read failed",error);return NextResponse.json({error:"The live tree could not be loaded. Please try again."},{status:500,headers});}
}
