import {requireCapability} from "@/lib/admin-access";
import {spnMuseumLayout} from "@/lib/spn-museum-layout";
import {readSpnLayoutInventory} from "@/lib/spn-layout-inventory";
import {MuseumLayoutWorkspace} from "@/components/admin/museum-layout-workspace";
import {MuseumQuestionnaire} from "@/components/admin/museum-questionnaire";
import {readSpnCuratorQuestions} from "@/lib/spn-curator-questionnaire";
import {hasCapability} from "@/lib/permissions";
import {loadSpnQuestionsAction, saveSpnAnswerAction, loadSpnCandidateAction} from "./actions";

export default async function SpnMovePlan(){
 const user=await requireCapability("access_museum");
 await requireCapability("view_full_saint_catalog");
 const [inventory,questions]=await Promise.all([readSpnLayoutInventory(),readSpnCuratorQuestions()]);
 return <div className="admin-stack"><MuseumQuestionnaire initial={questions} canEdit={hasCapability(user.roles,"manage_museum")} actions={{load:loadSpnQuestionsAction,save:saveSpnAnswerAction,profile:loadSpnCandidateAction}}/><MuseumLayoutWorkspace layout={spnMuseumLayout} {...inventory}/></div>;
}
