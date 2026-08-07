import type { ClientDiagnosticEventName } from "@/lib/telemetry-contract";

const SAFE_ERROR_CLASS_PATTERN = /^[A-Za-z][A-Za-z0-9]{0,63}$/;
const SAFE_FIRST_PARTY_SOURCE_PATTERN = /\/_next\/[A-Za-z0-9_./:-]+/g;
const MAX_SOURCE_LENGTH = 120;

export const CLIENT_ERROR_CHANNELS = [
  "window_error",
  "unhandled_rejection",
  "react_error"
] as const;

export const CLIENT_ERROR_VALUE_TYPES = [
  "error",
  "dom_exception",
  "string",
  "object",
  "null",
  "undefined",
  "other"
] as const;

export const CLIENT_ERROR_SOURCE_SCOPES = [
  "same_origin",
  "cross_origin",
  "extension",
  "blob",
  "native",
  "unavailable"
] as const;

export const CLIENT_RESOURCE_TYPES = [
  "script",
  "stylesheet",
  "image",
  "media",
  "other"
] as const;

export type ClientErrorChannel = (typeof CLIENT_ERROR_CHANNELS)[number];
export type ClientErrorSourceScope = (typeof CLIENT_ERROR_SOURCE_SCOPES)[number];
export type ClientResourceType = (typeof CLIENT_RESOURCE_TYPES)[number];

export type ClientDiagnostic = {
  name: Exclude<ClientDiagnosticEventName, "client_error_suppressed">;
  value: string;
};

export function buildClientErrorDiagnostic({
  channel,
  error,
  filename,
  origin
}: {
  channel: ClientErrorChannel;
  error: unknown;
  filename?: string;
  origin: string;
}): ClientDiagnostic {
  const stack = getErrorStack(error);
  const stackSources = getFirstPartyStackSources(stack, origin);
  const filenameSource = getFirstPartySource(filename, origin);
  const sources = stackSources.length > 0
    ? stackSources
    : filenameSource
      ? [filenameSource]
      : [];

  if (sources.length > 0) {
    const source = sources[0];
    const fingerprint = hashSanitizedFrames(sources);
    return {
      name: "client_error",
      value: `${channel}|${getSafeErrorClass(error)}|${source}|${fingerprint}`
    };
  }

  return {
    name: "client_opaque_error",
    value: `${channel}|${getErrorValueType(error)}|${getSourceScope(filename, stack, origin)}`
  };
}

export function buildClientResourceDiagnostic({
  origin,
  resourceType,
  sourceUrl
}: {
  origin: string;
  resourceType: ClientResourceType;
  sourceUrl?: string;
}): ClientDiagnostic {
  const source = getFirstPartySource(sourceUrl, origin);
  return {
    name: "client_resource_error",
    value: `${resourceType}|${getSourceScope(sourceUrl, undefined, origin)}|${source ?? "unknown"}`
  };
}

function getSafeErrorClass(error: unknown) {
  if (!error || (typeof error !== "object" && typeof error !== "function")) return "Error";
  const name = "name" in error && typeof error.name === "string" ? error.name : "Error";
  return SAFE_ERROR_CLASS_PATTERN.test(name) ? name : "Error";
}

function getErrorStack(error: unknown) {
  if (!error || (typeof error !== "object" && typeof error !== "function")) return undefined;
  return "stack" in error && typeof error.stack === "string" ? error.stack : undefined;
}

function getErrorValueType(error: unknown): (typeof CLIENT_ERROR_VALUE_TYPES)[number] {
  if (error === null) return "null";
  if (error === undefined) return "undefined";
  if (typeof DOMException !== "undefined" && error instanceof DOMException) return "dom_exception";
  if (error instanceof Error) return "error";
  if (typeof error === "string") return "string";
  if (typeof error === "object") return "object";
  return "other";
}

function getFirstPartyStackSources(stack: string | undefined, origin: string) {
  if (!stack) return [];
  const sources: string[] = [];

  for (const line of stack.split("\n").slice(0, 10)) {
    const originIndex = line.indexOf(origin);
    if (originIndex < 0) continue;
    const sourceText = line.slice(originIndex + origin.length).split(/[?#]/, 1)[0];
    const matches = sourceText.match(SAFE_FIRST_PARTY_SOURCE_PATTERN) ?? [];
    for (const match of matches) {
      const source = match.slice(0, MAX_SOURCE_LENGTH);
      if (!sources.includes(source)) sources.push(source);
    }
  }

  return sources;
}

function getFirstPartySource(rawUrl: string | undefined, origin: string) {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl, origin);
    if (url.origin !== origin || !url.pathname.startsWith("/_next/")) return null;
    const source = url.pathname.match(SAFE_FIRST_PARTY_SOURCE_PATTERN)?.[0];
    return source?.slice(0, MAX_SOURCE_LENGTH) ?? null;
  } catch {
    return null;
  }
}

function getSourceScope(rawUrl: string | undefined, stack: string | undefined, origin: string): ClientErrorSourceScope {
  const combined = `${rawUrl ?? ""}\n${stack ?? ""}`;
  if (/\b(?:chrome|moz|safari-web)-extension:/i.test(combined)) return "extension";
  if (/\bblob:/i.test(combined)) return "blob";
  if (/\[native code\]|\bnative\b/i.test(combined)) return "native";
  if (rawUrl) {
    try {
      const url = new URL(rawUrl, origin);
      if (url.origin === origin) return "same_origin";
      if (url.protocol === "http:" || url.protocol === "https:") return "cross_origin";
    } catch {
      // Fall through to the stack-only classification.
    }
  }
  if (combined.includes(origin)) return "same_origin";
  if (/https?:\/\//i.test(combined)) return "cross_origin";
  return "unavailable";
}

function hashSanitizedFrames(sources: string[]) {
  let hash = 0x811c9dc5;
  for (const character of sources.join(">")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
