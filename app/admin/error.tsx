"use client";

import { useEffect } from "react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Admin route error", { digest: error.digest, error });
  }, [error]);

  return (
    <section className="review-panel review-panel--workflow admin-recovery" role="alert">
      <div className="review-workflow__heading">
        <div className="review-workflow__eyebrow">Admin recovery</div>
        <h1>This editor could not complete the request</h1>
        <p>Your latest browser or server draft remains available. Retry the request, or reload the editor if the problem continues.</p>
      </div>
      {error.digest ? <p className="admin-recovery__reference"><span>Reference</span> <code>{error.digest}</code></p> : null}
      <div className="review-actions">
        <button className="admin-form-button" type="button" onClick={reset}>Retry</button>
        <button className="admin-form-button admin-form-button--secondary" type="button" onClick={() => window.location.reload()}>Reload editor</button>
      </div>
    </section>
  );
}
