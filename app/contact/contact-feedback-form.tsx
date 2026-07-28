"use client";

import { useActionState } from "react";
import type { FeedbackContext } from "@/lib/feedback-context";
import { sendFeedback, type FeedbackFormState } from "./actions";

type ContactFeedbackFormProps = {
  context: FeedbackContext | null;
  submissionKey: string;
};

const initialState: FeedbackFormState = { status: "idle", message: "" };

export function ContactFeedbackForm({ context, submissionKey }: ContactFeedbackFormProps) {
  const [state, formAction, isPending] = useActionState(sendFeedback, initialState);

  if (state.status === "success") {
    return (
      <div className="card form-stack contact-form" role="status" aria-live="polite">
        <div>
          <div className="eyebrow">Feedback received</div>
          <h2>Thank you</h2>
          <p>{state.message}</p>
          {state.reference ? <p className="feedback-reference">Reference: {state.reference}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="card form-stack contact-form">
      <input name="submissionKey" type="hidden" value={submissionKey} />
      {context?.entityType && context.entityType !== "page" ? (
        <>
          <input name="entityType" type="hidden" value={context.entityType} />
          <input name="entitySlug" type="hidden" value={context.entitySlug} />
        </>
      ) : null}
      {context?.pagePath ? <input name="page" type="hidden" value={context.pagePath} /> : null}

      {context ? (
        <label>
          Related page
          <input value={context.pageTitle ? `${context.pageTitle} — ${context.pagePath}` : context.pagePath} readOnly />
        </label>
      ) : null}

      <label>
        What is this about?
        <select name="category" defaultValue="correction" required>
          <option value="correction">Correction</option>
          <option value="source_citation">Source or citation</option>
          <option value="name_spelling">Name or spelling</option>
          <option value="missing_information">Missing information</option>
          <option value="technical_issue">Technical issue</option>
          <option value="other">Other</option>
        </select>
      </label>

      <label>
        Your name
        <input
          name="name"
          placeholder="Optional"
        />
      </label>

      <label>
        Your email
        <input
          name="email"
          placeholder="Optional"
          type="email"
        />
      </label>

      <label>
        Feedback
        <textarea
          name="message"
          placeholder="Share a correction, source, spelling note, or other feedback."
          required
        />
      </label>

      <label>
        Supporting source
        <input
          name="supportingSourceUrl"
          placeholder="Optional link to a source"
          type="url"
        />
      </label>

      <label className="sr-only">
        Company
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>

      {state.message ? (
        <p className={`form-status form-status--${state.status}`} role="status" aria-live="polite">
          {state.message}
        </p>
      ) : null}

      <div className="form-actions">
        <button className="button button--primary" type="submit" disabled={isPending}>
          {isPending ? "Sending..." : "Send feedback"}
        </button>
      </div>
    </form>
  );
}
