import {
  AdminTraditionEditorPage,
  type AdminTraditionEditorPageProps
} from "../page";

export default function AdminTraditionMediaPage(props: AdminTraditionEditorPageProps) {
  return <AdminTraditionEditorPage {...props} activeTab="media" />;
}
