import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import { resolveFeedbackContext } from "@/lib/feedback-context";
import { logPageView } from "@/lib/page-views";
import { ContactFeedbackForm } from "./contact-feedback-form";

type ContactPageProps = {
  searchParams: Promise<{
    type?: string;
    slug?: string;
    page?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Contact",
  description: "Send feedback, corrections, and source notes to the Hindu Saints Archive."
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { type, slug, page } = await searchParams;
  const context = await resolveFeedbackContext({
    entityType: type,
    entitySlug: slug,
    pagePath: page
  });
  logPageView("/contact");

  return (
    <main className="page-shell section site-grid contact-page">
      <div>
        <div className="eyebrow">Contact</div>
        <h1 className="page-title">Send Feedback</h1>
        <p className="lede">
          Share corrections, source notes, alternate spellings, or other feedback with the editorial team.
        </p>
      </div>

      <ContactFeedbackForm context={context} submissionKey={randomUUID()} />
    </main>
  );
}
