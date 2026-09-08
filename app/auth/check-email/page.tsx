import type { Metadata } from "next";
import { AdminAuthNotice } from "@/components/admin/admin-sign-in";

export const metadata: Metadata = {
  title: "Check your email",
  robots: {
    index: false,
    follow: false
  }
};

export default function CheckEmailPage() {
  return <AdminAuthNotice />;
}
