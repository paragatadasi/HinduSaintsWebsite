export function getInstagramLinkProps(href: string) {
  return isInstagramUrl(href) ? { target: "_blank", rel: "noreferrer" } : {};
}

function isInstagramUrl(href: string) {
  try {
    const url = new URL(href);
    return url.hostname === "instagram.com" || url.hostname.endsWith(".instagram.com");
  } catch {
    return false;
  }
}
