import {
  isBucketedPerformanceEventName,
  TELEMETRY_VALUE_BUCKETS,
  type TelemetryEventName
} from "@/lib/telemetry-contract";
import {
  CLIENT_ERROR_CHANNELS,
  CLIENT_ERROR_SOURCE_SCOPES,
  CLIENT_ERROR_VALUE_TYPES,
  CLIENT_RESOURCE_TYPES
} from "@/lib/telemetry-errors";

const ERROR_CLASS_PATTERN = /^[A-Za-z][A-Za-z0-9]{0,63}$/;
const ERROR_SOURCE_PATTERN = /^\/_next\/[A-Za-z0-9_./:-]{1,120}$/;
const ERROR_FINGERPRINT_PATTERN = /^[a-f0-9]{8}$/;
const DIAGNOSTIC_EVENT_NAMES = new Set(["client_error", "client_opaque_error", "client_resource_error"]);

export function normalizeTelemetryValue(name: TelemetryEventName, rawValue: string | undefined) {
  if (isBucketedPerformanceEventName(name)) {
    return TELEMETRY_VALUE_BUCKETS.find((bucket) => bucket === rawValue) ?? null;
  }

  if (name === "client_error") {
    return normalizeConfirmedError(rawValue);
  }

  if (name === "client_opaque_error") {
    const parts = rawValue?.split("|") ?? [];
    if (parts.length !== 3) return null;
    const [channel, valueType, sourceScope] = parts;
    return includes(CLIENT_ERROR_CHANNELS, channel)
      && includes(CLIENT_ERROR_VALUE_TYPES, valueType)
      && includes(CLIENT_ERROR_SOURCE_SCOPES, sourceScope)
      ? parts.join("|")
      : null;
  }

  if (name === "client_resource_error") {
    const parts = rawValue?.split("|") ?? [];
    if (parts.length !== 3) return null;
    const [resourceType, sourceScope, source] = parts;
    return includes(CLIENT_RESOURCE_TYPES, resourceType)
      && includes(CLIENT_ERROR_SOURCE_SCOPES, sourceScope)
      && (source === "unknown" || ERROR_SOURCE_PATTERN.test(source))
      ? parts.join("|")
      : null;
  }

  if (name === "client_error_suppressed") {
    const parts = rawValue?.split("|") ?? [];
    if (parts.length !== 2) return null;
    const [event, reason] = parts;
    return DIAGNOSTIC_EVENT_NAMES.has(event) && (reason === "repeat_limit" || reason === "unique_limit")
      ? parts.join("|")
      : null;
  }

  return rawValue ? null : "";
}

function normalizeConfirmedError(rawValue: string | undefined) {
  const parts = rawValue?.split("|") ?? [];
  if (parts.length === 2) {
    const [errorClass, source] = parts;
    return ERROR_CLASS_PATTERN.test(errorClass) && (source === "unknown" || ERROR_SOURCE_PATTERN.test(source))
      ? parts.join("|")
      : null;
  }

  if (parts.length !== 4) return null;
  const [channel, errorClass, source, fingerprint] = parts;
  return includes(CLIENT_ERROR_CHANNELS, channel)
    && ERROR_CLASS_PATTERN.test(errorClass)
    && ERROR_SOURCE_PATTERN.test(source)
    && ERROR_FINGERPRINT_PATTERN.test(fingerprint)
    ? parts.join("|")
    : null;
}

function includes<const Values extends readonly string[]>(values: Values, value: string | undefined): value is Values[number] {
  return typeof value === "string" && values.includes(value);
}
