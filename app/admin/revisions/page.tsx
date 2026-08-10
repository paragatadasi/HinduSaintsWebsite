import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin-access";
import { canReviewEditorialRevisions } from "@/lib/permissions";

export default async function EditorialReviewQueuePage() {
  const user = await requireAdminUser();
  if (!canReviewEditorialRevisions(user.roles)) redirect("/admin?access=denied");
  redirect("/admin#editorial-reviews");
}
