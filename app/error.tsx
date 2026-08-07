"use client";

import { useEffect } from "react";
import { recordReactError } from "@/lib/telemetry-client";

export default function PublicRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    recordReactError(error);
  }, [error]);

  return (
    <main className="page-shell">
      <section className="section admin-stack">
        <div>
          <div className="eyebrow">Temporary interruption</div>
          <h1>This page could not be displayed</h1>
          <p>Try loading it again. If the problem continues, please return a little later.</p>
        </div>
        <div>
          <button className="button button--primary" onClick={reset} type="button">
            Try again
          </button>
        </div>
      </section>
    </main>
  );
}
