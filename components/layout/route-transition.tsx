"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type NavigationPhase = "idle" | "loading" | "finishing";

const PAGE_TRANSITION_FALLBACK_MS = 600;
const PROGRESS_FINISH_FALLBACK_MS = 300;
const NAVIGATION_SAFETY_FALLBACK_MS = 30_000;

function isInternalNavigation(event: MouseEvent, link: HTMLAnchorElement) {
  if (
    event.defaultPrevented
    || event.button !== 0
    || event.metaKey
    || event.ctrlKey
    || event.shiftKey
    || event.altKey
    || link.target === "_blank"
    || link.hasAttribute("download")
  ) {
    return false;
  }

  const destination = new URL(link.href, window.location.href);
  const current = new URL(window.location.href);

  if (destination.origin !== current.origin) {
    return false;
  }

  return (
    destination.pathname !== current.pathname
    || destination.search !== current.search
  );
}

export function RouteTransition() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [phase, setPhase] = useState<NavigationPhase>("idle");
  const phaseRef = useRef<NavigationPhase>("idle");
  const previousRouteRef = useRef<string | null>(null);
  const transitionFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function beginNavigation() {
      phaseRef.current = "loading";
      setPhase("loading");
      document.documentElement.dataset.routePending = "true";

      if (navigationFallbackRef.current) {
        clearTimeout(navigationFallbackRef.current);
      }

      navigationFallbackRef.current = setTimeout(() => {
        if (phaseRef.current === "loading") {
          phaseRef.current = "idle";
          setPhase("idle");
          delete document.documentElement.dataset.routePending;
        }
      }, NAVIGATION_SAFETY_FALLBACK_MS);
    }

    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest("a");

      if (link instanceof HTMLAnchorElement && isInternalNavigation(event, link)) {
        beginNavigation();
      }
    }

    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("popstate", beginNavigation);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("popstate", beginNavigation);
      delete document.documentElement.dataset.routePending;
      delete document.documentElement.dataset.routeEntering;

      if (navigationFallbackRef.current) {
        clearTimeout(navigationFallbackRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (previousRouteRef.current === null) {
      previousRouteRef.current = routeKey;
      return;
    }

    if (previousRouteRef.current === routeKey) {
      return;
    }

    previousRouteRef.current = routeKey;
    phaseRef.current = "finishing";
    setPhase("finishing");
    delete document.documentElement.dataset.routePending;
    document.documentElement.dataset.routeEntering = "true";

    if (navigationFallbackRef.current) {
      clearTimeout(navigationFallbackRef.current);
    }

    if (transitionFallbackRef.current) {
      clearTimeout(transitionFallbackRef.current);
    }

    transitionFallbackRef.current = setTimeout(() => {
      delete document.documentElement.dataset.routeEntering;
    }, PAGE_TRANSITION_FALLBACK_MS);

    if (progressFallbackRef.current) {
      clearTimeout(progressFallbackRef.current);
    }

    progressFallbackRef.current = setTimeout(() => {
      phaseRef.current = "idle";
      setPhase("idle");
    }, PROGRESS_FINISH_FALLBACK_MS);
  }, [routeKey]);

  useEffect(() => {
    function handlePageAnimationEnd(event: AnimationEvent) {
      if (event.animationName === "route-page-enter") {
        delete document.documentElement.dataset.routeEntering;
      }
    }

    document.addEventListener("animationend", handlePageAnimationEnd);

    return () => {
      document.removeEventListener("animationend", handlePageAnimationEnd);

      if (transitionFallbackRef.current) {
        clearTimeout(transitionFallbackRef.current);
      }

      if (progressFallbackRef.current) {
        clearTimeout(progressFallbackRef.current);
      }

      if (navigationFallbackRef.current) {
        clearTimeout(navigationFallbackRef.current);
      }
    };
  }, []);

  function handleProgressTransitionEnd(event: React.TransitionEvent<HTMLDivElement>) {
    if (
      phaseRef.current === "finishing"
      && event.propertyName === "transform"
      && event.target === event.currentTarget
    ) {
      if (progressFallbackRef.current) {
        clearTimeout(progressFallbackRef.current);
      }

      phaseRef.current = "idle";
      setPhase("idle");
    }
  }

  return (
    <div
      className="route-progress"
      data-state={phase}
      role="progressbar"
      aria-label="Loading the next page"
      aria-hidden={phase === "idle"}
    >
      <div
        className="route-progress__bar"
        onTransitionEnd={handleProgressTransitionEnd}
      />
    </div>
  );
}
