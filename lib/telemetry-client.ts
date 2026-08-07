import {
  isTelemetryEngagementEventName,
  type TelemetryEngagementEventName,
  type TelemetryEvent,
  type TelemetryEventName,
  type TelemetryValueBucket
} from "@/lib/telemetry-contract";
import {
  buildClientErrorDiagnostic,
  buildClientResourceDiagnostic,
  type ClientErrorChannel,
  type ClientResourceType
} from "@/lib/telemetry-errors";

const TELEMETRY_ENDPOINT = "/api/telemetry";
const FLUSH_INTERVAL_MS = 10_000;
const MAX_QUEUED_EVENTS = 20;
const PERFORMANCE_SAMPLE_RATE = 0.1;
const MAX_DIAGNOSTIC_REPORTS_PER_PAGE = 3;
const MAX_UNIQUE_DIAGNOSTICS_PER_PAGE = 20;

let currentPath = "";
let performancePath = "";
let performanceSampled = false;
let pendingNavigationPath = "";
let pendingNavigationStartedAt = 0;
let flushTimer: ReturnType<typeof setTimeout> | undefined;
const queue: TelemetryEvent[] = [];
const diagnosticOccurrences = new Map<string, number>();
const reportedSuppressions = new Set<string>();
let reportedUniqueDiagnosticLimit = false;

type WebVitalMetric = {
  name: string;
  value: number;
};

export function setTelemetryPage(path: string) {
  if (currentPath && currentPath !== path) resetDiagnosticLimits();
  currentPath = path;
  if (!performancePath) {
    performancePath = path;
    performanceSampled = Math.random() < PERFORMANCE_SAMPLE_RATE;
  }
  recordTelemetry("page_view", path);
}

export function recordEngagement(name: TelemetryEngagementEventName) {
  recordTelemetry(name, getCurrentPath());
}

export function recordDeclarativeEngagement(value: string) {
  if (isTelemetryEngagementEventName(value)) {
    recordEngagement(value);
  }
}

export function markNavigationStarted(path: string) {
  pendingNavigationPath = path;
  pendingNavigationStartedAt = performance.now();
  recordTelemetry("navigation_started", path);
}

export function markNavigationCompleted(path: string) {
  if (!pendingNavigationPath) return;
  const duration = performance.now() - pendingNavigationStartedAt;
  recordTelemetry("navigation_duration", path, getBucket(duration, 500, 1_500));
  recordTelemetry("navigation_completed", path);
  pendingNavigationPath = "";
  pendingNavigationStartedAt = 0;
}

export function recordClientError({
  channel,
  error,
  filename
}: {
  channel: ClientErrorChannel;
  error: unknown;
  filename?: string;
}) {
  recordClientDiagnostic(buildClientErrorDiagnostic({
    channel,
    error,
    filename,
    origin: window.location.origin
  }));
}

export function recordReactError(error: unknown) {
  recordClientError({ channel: "react_error", error });
}

export function recordClientResourceError(target: EventTarget | null) {
  const resource = getResourceFailure(target);
  if (!resource) return false;
  recordClientDiagnostic(buildClientResourceDiagnostic({
    ...resource,
    origin: window.location.origin
  }));
  return true;
}

export function reportWebVital(metric: WebVitalMetric) {
  if (!performanceSampled) return;

  const eventName = getWebVitalEventName(metric.name);
  if (!eventName) return;

  recordTelemetry(eventName, performancePath || getCurrentPath(), getWebVitalBucket(metric.name, metric.value));
}

export function flushTelemetryForPageExit() {
  if (pendingNavigationPath) {
    recordTelemetry("navigation_abandoned", pendingNavigationPath);
    pendingNavigationPath = "";
    pendingNavigationStartedAt = 0;
  }

  flushTelemetry();
}

function recordTelemetry(name: TelemetryEventName, path: string, value?: string) {
  if (!isClientTrackablePath(path) || queue.length >= MAX_QUEUED_EVENTS) return;

  queue.push({ name, path, ...(value ? { value } : {}) });

  if (queue.length >= MAX_QUEUED_EVENTS) {
    flushTelemetry();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flushTelemetry, FLUSH_INTERVAL_MS);
  }
}

function recordClientDiagnostic(diagnostic: { name: "client_error" | "client_opaque_error" | "client_resource_error"; value: string }) {
  const key = `${diagnostic.name}|${diagnostic.value}`;
  const currentCount = diagnosticOccurrences.get(key);

  if (currentCount === undefined && diagnosticOccurrences.size >= MAX_UNIQUE_DIAGNOSTICS_PER_PAGE) {
    if (!reportedUniqueDiagnosticLimit) {
      reportedUniqueDiagnosticLimit = true;
      recordTelemetry("client_error_suppressed", getCurrentPath(), `${diagnostic.name}|unique_limit`);
    }
    return;
  }

  const nextCount = (currentCount ?? 0) + 1;
  diagnosticOccurrences.set(key, nextCount);
  if (nextCount <= MAX_DIAGNOSTIC_REPORTS_PER_PAGE) {
    recordTelemetry(diagnostic.name, getCurrentPath(), diagnostic.value);
    return;
  }

  if (!reportedSuppressions.has(key)) {
    reportedSuppressions.add(key);
    recordTelemetry("client_error_suppressed", getCurrentPath(), `${diagnostic.name}|repeat_limit`);
  }
}

function resetDiagnosticLimits() {
  diagnosticOccurrences.clear();
  reportedSuppressions.clear();
  reportedUniqueDiagnosticLimit = false;
}

function getResourceFailure(target: EventTarget | null): { resourceType: ClientResourceType; sourceUrl?: string } | null {
  if (target instanceof HTMLScriptElement) {
    return { resourceType: "script", sourceUrl: target.src };
  }
  if (target instanceof HTMLLinkElement && target.rel === "stylesheet") {
    return { resourceType: "stylesheet", sourceUrl: target.href };
  }
  if (target instanceof HTMLImageElement) {
    return { resourceType: "image", sourceUrl: target.currentSrc || target.src };
  }
  if (target instanceof HTMLAudioElement || target instanceof HTMLVideoElement || target instanceof HTMLSourceElement) {
    return { resourceType: "media", sourceUrl: target instanceof HTMLSourceElement ? target.src : target.currentSrc || target.src };
  }
  if (target instanceof Element && target !== document.documentElement && target !== document.body) {
    return { resourceType: "other" };
  }
  return null;
}

function isClientTrackablePath(path: string) {
  if (!path.startsWith("/")) return false;
  return !["/admin", "/api", "/media", "/museumadmin", "/_next"].some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

function flushTelemetry() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = undefined;
  }

  if (queue.length === 0) return;

  const events = queue.splice(0, MAX_QUEUED_EVENTS);
  const payload = JSON.stringify({ events });

  if (navigator.sendBeacon) {
    const accepted = navigator.sendBeacon(
      TELEMETRY_ENDPOINT,
      new Blob([payload], { type: "application/json" })
    );
    if (accepted) return;
  }

  void fetch(TELEMETRY_ENDPOINT, {
    method: "POST",
    body: payload,
    headers: { "Content-Type": "application/json" },
    keepalive: true
  });
}

function getCurrentPath() {
  return currentPath || window.location.pathname;
}

function getWebVitalEventName(name: string): TelemetryEventName | null {
  if (name === "LCP") return "web_vital_lcp";
  if (name === "INP") return "web_vital_inp";
  if (name === "CLS") return "web_vital_cls";
  if (name === "TTFB") return "web_vital_ttfb";
  return null;
}

function getWebVitalBucket(name: string, value: number): TelemetryValueBucket {
  if (name === "LCP") return getBucket(value, 2_500, 4_000);
  if (name === "INP") return getBucket(value, 200, 500);
  if (name === "CLS") return getBucket(value, 0.1, 0.25);
  return getBucket(value, 800, 1_800);
}

function getBucket(value: number, goodLimit: number, poorLimit: number): TelemetryValueBucket {
  if (value <= goodLimit) return "good";
  if (value <= poorLimit) return "needs_improvement";
  return "poor";
}
