"use client";

import { useActionState } from "react";
import { sendFeedback, type FeedbackFormState } from "./actions";

type ContactFeedbackFormProps = {
  pagePath?: string;
  saintName?: string;
};

const CONTACT_EMAIL = "hindusaints@gmail.com";
const initialState: FeedbackFormState = { status: "idle", message: "" };

export function ContactFeedbackForm({ pagePath, saintName }: ContactFeedbackFormProps) {
  const [state, formAction, isPending] = useActionState(sendFeedback, initialState);

  return (
    <form action={formAction} className="card form-stack contact-form">
      {saintName ? (
        <label>
          Saint page
          <input name="saint" value={saintName} readOnly />
        </label>
      ) : null}

      {pagePath ? (
        <label>
          Page link
          <input name="page" value={pagePath} readOnly />
        </label>
      ) : null}

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
          {isPending ? "Sending..." : "Send feedback email"}
        </button>
        <a className="button button--secondary" href={`mailto:${CONTACT_EMAIL}`}>
          Email directly
        </a>
      </div>
    </form>
  );
}
