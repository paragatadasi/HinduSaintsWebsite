export const TELEMETRY_EVENT_NAMES = [
  "page_view",
  "navigation_started",
  "navigation_completed",
  "navigation_abandoned",
  "navigation_duration",
  "client_error",
  "client_opaque_error",
  "client_resource_error",
  "client_error_suppressed",
  "web_vital_lcp",
  "web_vital_inp",
  "web_vital_cls",
  "web_vital_ttfb",
  "header_search_open",
  "header_search_submit",
  "saint_biography_open",
  "saint_instagram_open",
  "saint_gallery_open",
  "saint_gallery_previous",
  "saint_gallery_next",
  "map_place_select",
  "instagram_post_open"
] as const;

export const TELEMETRY_VALUE_BUCKETS = [
  "good",
  "needs_improvement",
  "poor"
] as const;

export type TelemetryEventName = (typeof TELEMETRY_EVENT_NAMES)[number];
export type TelemetryValueBucket = (typeof TELEMETRY_VALUE_BUCKETS)[number];

export type TelemetryEvent = {
  name: TelemetryEventName;
  path: string;
  value?: string;
};

export const WEB_VITAL_EVENT_NAMES = [
  "web_vital_lcp",
  "web_vital_inp",
  "web_vital_cls",
  "web_vital_ttfb"
] as const satisfies readonly TelemetryEventName[];

export const BUCKETED_PERFORMANCE_EVENT_NAMES = [
  ...WEB_VITAL_EVENT_NAMES,
  "navigation_duration"
] as const satisfies readonly TelemetryEventName[];

export const ENGAGEMENT_EVENT_NAMES = [
  "header_search_open",
  "header_search_submit",
  "saint_biography_open",
  "saint_instagram_open",
  "saint_gallery_open",
  "saint_gallery_previous",
  "saint_gallery_next",
  "map_place_select",
  "instagram_post_open"
] as const satisfies readonly TelemetryEventName[];

export const CLIENT_DIAGNOSTIC_EVENT_NAMES = [
  "client_error",
  "client_opaque_error",
  "client_resource_error",
  "client_error_suppressed"
] as const satisfies readonly TelemetryEventName[];

export type ClientDiagnosticEventName = (typeof CLIENT_DIAGNOSTIC_EVENT_NAMES)[number];

export type TelemetryEngagementEventName = (typeof ENGAGEMENT_EVENT_NAMES)[number];

export function isTelemetryEngagementEventName(value: string): value is TelemetryEngagementEventName {
  return (ENGAGEMENT_EVENT_NAMES as readonly string[]).includes(value);
}

export function isWebVitalEventName(value: TelemetryEventName): value is (typeof WEB_VITAL_EVENT_NAMES)[number] {
  return (WEB_VITAL_EVENT_NAMES as readonly string[]).includes(value);
}

export function isBucketedPerformanceEventName(value: TelemetryEventName): value is (typeof BUCKETED_PERFORMANCE_EVENT_NAMES)[number] {
  return (BUCKETED_PERFORMANCE_EVENT_NAMES as readonly string[]).includes(value);
}
