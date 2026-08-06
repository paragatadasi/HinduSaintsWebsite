import {
  isBucketedPerformanceEventName,
  TELEMETRY_VALUE_BUCKETS,
  type TelemetryEventName
} from "@/lib/telemetry-contract";

const ERROR_CLASS_PATTERN = /^[A-Za-z][A-Za-z0-9]{0,63}$/;
const ERROR_SOURCE_PATTERN = /^\/_next\/[A-Za-z0-9_./:-]{1,180}$/;

export function normalizeTelemetryValue(name: TelemetryEventName, rawValue: string | undefined) {
  if (isBucketedPerformanceEventName(name)) {
    return TELEMETRY_VALUE_BUCKETS.find((bucket) => bucket === rawValue) ?? null;
  }

  if (name === "client_error") {
    const separator = rawValue?.indexOf("|") ?? -1;
    if (!rawValue || separator < 1) return "Error|unknown";

    const errorClass = rawValue.slice(0, separator);
    const source = rawValue.slice(separator + 1);
    return `${ERROR_CLASS_PATTERN.test(errorClass) ? errorClass : "Error"}|${ERROR_SOURCE_PATTERN.test(source) ? source : "unknown"}`;
  }

  return rawValue ? null : "";
}
