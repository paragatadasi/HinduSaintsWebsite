import { redirect } from "next/navigation";

export default function LegacyAdminTraditionsRedirectPage() {
  redirect("/admin/traditions");
}
