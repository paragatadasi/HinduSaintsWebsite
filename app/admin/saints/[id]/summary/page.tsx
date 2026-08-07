import {
  AdminSaintEditorPage,
  type AdminSaintEditorPageProps
} from "../page";

export default function AdminSaintSummaryPage(props: AdminSaintEditorPageProps) {
  return <AdminSaintEditorPage {...props} activeTab="summary" />;
}
