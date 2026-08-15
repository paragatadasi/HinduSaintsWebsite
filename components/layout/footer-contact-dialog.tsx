"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import { ContactFeedbackForm } from "@/app/contact/contact-feedback-form";

type FooterContactDialogProps = {
  privacyPolicyHref: string;
  submissionKey: string;
};

export function FooterContactDialog({ privacyPolicyHref, submissionKey }: FooterContactDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        className="site-footer__contact"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        Contact us
      </button>
      <dialog
        aria-labelledby="footer-contact-title"
        className="footer-contact-dialog"
        ref={dialogRef}
      >
        <div className="footer-contact-dialog__header">
          <div>
            <div className="eyebrow">Contact us</div>
            <h2 id="footer-contact-title">Send feedback</h2>
          </div>
          <button
            aria-label="Close contact form"
            className="footer-contact-dialog__close"
            onClick={() => dialogRef.current?.close()}
            type="button"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <ContactFeedbackForm
          context={null}
          privacyPolicyHref={privacyPolicyHref}
          submissionKey={submissionKey}
        />
      </dialog>
    </>
  );
}
