"use client";

import { useMemo, useState } from "react";

type ContactFeedbackFormProps = {
  pagePath?: string;
  saintName?: string;
};

const CONTACT_EMAIL = "hindusaints@gmail.com";

export function ContactFeedbackForm({ pagePath, saintName }: ContactFeedbackFormProps) {
  const [name, setName] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [message, setMessage] = useState("");

  const mailtoHref = useMemo(() => {
    const subject = saintName ? `Feedback for ${saintName}` : "Hindu Saints Archive feedback";
    const bodyParts = [
      saintName ? `Saint: ${saintName}` : null,
      pagePath ? `Page: ${pagePath}` : null,
      name ? `Name: ${name}` : null,
      replyTo ? `Reply-to: ${replyTo}` : null,
      "",
      message || "Feedback:"
    ].filter((part) => part !== null);

    const params = new URLSearchParams({
      subject,
      body: bodyParts.join("\n")
    });

    return `mailto:${CONTACT_EMAIL}?${params.toString()}`;
  }, [message, name, pagePath, replyTo, saintName]);

  return (
    <form className="card form-stack contact-form">
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
          onChange={(event) => setName(event.target.value)}
          placeholder="Optional"
          value={name}
        />
      </label>

      <label>
        Your email
        <input
          name="email"
          onChange={(event) => setReplyTo(event.target.value)}
          placeholder="Optional"
          type="email"
          value={replyTo}
        />
      </label>

      <label>
        Feedback
        <textarea
          name="message"
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Share a correction, source, spelling note, or other feedback."
          value={message}
        />
      </label>

      <div className="form-actions">
        <a className="button button--primary" href={mailtoHref}>
          Send feedback email
        </a>
        <a className="button button--secondary" href={`mailto:${CONTACT_EMAIL}`}>
          Email directly
        </a>
      </div>
    </form>
  );
}
