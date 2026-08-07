export type SiteEnvironment = "development" | "staging" | "production" | "test";

export function getSiteEnvironment(
  value = process.env.SITE_ENVIRONMENT
): SiteEnvironment {
  switch (value?.trim().toLowerCase()) {
    case "staging":
      return "staging";
    case "production":
      return "production";
    case "test":
      return "test";
    default:
      return "development";
  }
}

export function isStagingEnvironment(value = process.env.SITE_ENVIRONMENT) {
  return getSiteEnvironment(value) === "staging";
}

export function shouldBlockSearchIndexing(
  hostname: string,
  value = process.env.SITE_ENVIRONMENT
) {
  return isStagingEnvironment(value)
    || hostname.trim().toLowerCase() === "staging.hindusaints.org";
}
