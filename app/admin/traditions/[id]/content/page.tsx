import {
  AdminTraditionEditorPage,
  type AdminTraditionEditorPageProps
} from "../page";

export default function AdminTraditionContentPage(props: AdminTraditionEditorPageProps) {
  return <AdminTraditionEditorPage {...props} activeTab="content" />;
}
