import {
  AdminTraditionEditorPage,
  type AdminTraditionEditorPageProps
} from "../page";

export default function AdminTraditionSummaryPage(props: AdminTraditionEditorPageProps) {
  return <AdminTraditionEditorPage {...props} activeTab="summary" />;
}
