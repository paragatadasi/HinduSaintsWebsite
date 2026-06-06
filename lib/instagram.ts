export function getInstagramShortcode(url: string) {
  const match = url.match(/instagram\.com\/(?:p|reel)\/([^/?#]+)/i);
  return match?.[1] ?? null;
}
