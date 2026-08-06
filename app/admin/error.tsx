"use client";

import { useEffect } from "react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Admin route error", { digest: error.digest, error });
  }, [error]);

  return (
    <section className="review-panel form-status form-status--error" role="alert">
      <div className="eyebrow">Admin recovery</div>
      <h1>This editor could not complete the request</h1>
      <p>Interim editorial drafts are preserved automatically. Retry the request or reload the editor to restore the latest saved draft.</p>
      {error.digest ? <p className="form-field-hint">Reference: {error.digest}</p> : null}
      <div className="review-actions">
        <button className="admin-form-button" type="button" onClick={reset}>Retry</button>
        <button className="admin-form-button admin-form-button--secondary" type="button" onClick={() => window.location.reload()}>Reload editor</button>
      </div>
    </section>
  );
}
