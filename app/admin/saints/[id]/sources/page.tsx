import {
  AdminSaintEditorPage,
  type AdminSaintEditorPageProps
} from "../page";

export default function AdminSaintSourcesPage(props: AdminSaintEditorPageProps) {
  return <AdminSaintEditorPage {...props} activeTab="sources" />;
}
