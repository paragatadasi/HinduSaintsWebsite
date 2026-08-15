import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import { resolveFeedbackContext } from "@/lib/feedback-context";
import { ContactFeedbackForm } from "./contact-feedback-form";
import { buildPublicMetadata } from "@/lib/seo";
import { getPublicFooterContent } from "@/lib/site-config";

type ContactPageProps = {
  searchParams: Promise<{
    type?: string;
    slug?: string;
    page?: string;
  }>;
};

export const metadata: Metadata = buildPublicMetadata({
  title: "Contact",
  description: "Send feedback, corrections, and source notes to the Hindu Saints Archive.",
  path: "/contact"
});

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { type, slug, page } = await searchParams;
  const [context, footerContent] = await Promise.all([
    resolveFeedbackContext({
      entityType: type,
      entitySlug: slug,
      pagePath: page
    }),
    getPublicFooterContent()
  ]);

  return (
    <main className="page-shell section site-grid contact-page">
      <div>
        <div className="eyebrow">Contact</div>
        <h1 className="page-title">Send Feedback</h1>
        <p className="lede">
          Share corrections, source notes, alternate spellings, or other feedback with the editorial team.
        </p>
      </div>

      <ContactFeedbackForm
        context={context}
        privacyPolicyHref={footerContent.privacyPolicy.href}
        submissionKey={randomUUID()}
      />
    </main>
  );
}
