import type { Metadata } from "next";
import { ContactFeedbackForm } from "./contact-feedback-form";

type ContactPageProps = {
  searchParams: Promise<{
    page?: string;
    saint?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Contact",
  description: "Send feedback, corrections, and source notes to the Hindu Saints Archive."
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { page, saint } = await searchParams;

  return (
    <main className="page-shell section site-grid contact-page">
      <div>
        <div className="eyebrow">Contact</div>
        <h1 className="page-title">Send Feedback</h1>
        <p className="lede">
          Share corrections, source notes, alternate spellings, or other feedback with the editorial team.
        </p>
      </div>

      <ContactFeedbackForm pagePath={page} saintName={saint} />
    </main>
  );
}
