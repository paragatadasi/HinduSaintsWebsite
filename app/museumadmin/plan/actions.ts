"use server";
import {readMuseumDiagramLayouts,saveMuseumDiagramLayout,deleteMuseumDiagramLayout} from "@/lib/museum-diagram-layouts";
import {z} from "zod";
import {revalidatePath} from "next/cache";
import {assertCapability} from "@/lib/admin-access";
import {assertMuseumMutation} from "@/lib/museum-access";
import {MuseumConflict} from "@/lib/museum-service";
import {readSpnCuratorQuestions, saveSpnCuratorAnswer} from "@/lib/spn-curator-questionnaire";
import {readMuseumSaintProfiles} from "@/lib/museum-saint-profiles";

async function checkReadAccess() {
  await assertCapability("access_museum");
  await assertCapability("view_full_saint_catalog");
}
export async function loadSpnQuestionsAction() {
  await checkReadAccess();
  return readSpnCuratorQuestions();
}
export async function saveSpnAnswerAction(input: unknown) {
  await checkReadAccess();
  const actor = await assertMuseumMutation();
  try {
    await saveSpnCuratorAnswer(input, actor.id);
    revalidatePath("/museumadmin/overview");
    return {error: ""};
  } catch (error) {
    if (error instanceof MuseumConflict) return {error: error.message};
    if (error instanceof z.ZodError) return {error: error.issues[0]?.message || "Check your answer."};
    throw error;
  }
}
export async function loadSpnCandidateAction(raw: unknown) {
  await checkReadAccess();
  const input = z.object({caseId: z.string().max(100), revision: z.string().length(64), saintId: z.string().max(100)}).strict().parse(raw);
  const item = (await readSpnCuratorQuestions()).find(c => c.caseId === input.caseId);
  if (!item || item.revision !== input.revision || !item.candidates.some(s => s.id === input.saintId)) throw new MuseumConflict("The comparison record changed. Reload the questions.");
  return (await readMuseumSaintProfiles([input.saintId]))[input.saintId] ?? null;
}

export async function loadSpnDiagramLayoutsAction(){
 const user=await assertCapability("access_museum");await assertCapability("view_full_saint_catalog");
 return readMuseumDiagramLayouts("museum-spn",user.id);
}
async function changeSpnDiagram(input:unknown,remove:boolean){
 await checkReadAccess();const user=await assertMuseumMutation();
 try{
  const parsed=z.object({museumId:z.literal("museum-spn")}).passthrough().parse(input);
  return {data:await (remove?deleteMuseumDiagramLayout:saveMuseumDiagramLayout)(parsed,user.id),error:""};
 }catch(error){if(error instanceof MuseumConflict)return {data:null,error:error.message};if(error instanceof z.ZodError)return {data:null,error:error.issues[0]?.message||"Check this diagram view."};throw error;}
}
export async function saveSpnDiagramLayoutAction(input:unknown){return changeSpnDiagram(input,false);}
export async function deleteSpnDiagramLayoutAction(input:unknown){return changeSpnDiagram(input,true);}
