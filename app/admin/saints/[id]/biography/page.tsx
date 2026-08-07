import {
  AdminSaintEditorPage,
  type AdminSaintEditorPageProps
} from "../page";

export default function AdminSaintBiographyPage(props: AdminSaintEditorPageProps) {
  return <AdminSaintEditorPage {...props} activeTab="biography" />;
}
