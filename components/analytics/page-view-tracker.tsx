"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useReportWebVitals } from "next/web-vitals";
import {
  flushTelemetryForPageExit,
  recordClientError,
  recordClientResourceError,
  recordDeclarativeEngagement,
  reportWebVital,
  setTelemetryPage
} from "@/lib/telemetry-client";

export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    setTelemetryPage(pathname);
  }, [pathname]);

  useReportWebVitals(reportWebVital);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>("[data-telemetry-event]")
        : null;
      const interactiveTarget = event.target instanceof Element
        ? event.target.closest<HTMLElement>('a, button, input, select, textarea, [role="button"]')
        : null;
      if (interactiveTarget && interactiveTarget !== target && !interactiveTarget.dataset.telemetryEvent) {
        return;
      }
      if (target?.dataset.telemetryEvent) {
        recordDeclarativeEngagement(target.dataset.telemetryEvent);
      }
    }

    function handleSubmit(event: SubmitEvent) {
      const target = event.target instanceof HTMLFormElement ? event.target : null;
      if (target?.dataset.telemetrySubmit) {
        recordDeclarativeEngagement(target.dataset.telemetrySubmit);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>('[data-telemetry-event][role="button"]')
        : null;
      if (target?.dataset.telemetryEvent) {
        recordDeclarativeEngagement(target.dataset.telemetryEvent);
      }
    }

    function handleError(event: Event) {
      if (recordClientResourceError(event.target)) return;
      if (event instanceof ErrorEvent) {
        recordClientError({
          channel: "window_error",
          error: event.error,
          filename: event.filename
        });
      }
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      recordClientError({ channel: "unhandled_rejection", error: event.reason });
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("submit", handleSubmit, true);
    window.addEventListener("error", handleError, true);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("pagehide", flushTelemetryForPageExit);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("submit", handleSubmit, true);
      window.removeEventListener("error", handleError, true);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("pagehide", flushTelemetryForPageExit);
    };
  }, []);

  return null;
}
