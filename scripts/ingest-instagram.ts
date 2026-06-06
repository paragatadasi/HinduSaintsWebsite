import { getInstagramShortcode } from "../lib/instagram";

const sampleUrl = process.argv[2] ?? "";

if (!sampleUrl) {
  console.log("Instagram ingestion placeholder");
  console.log("Usage: npm run ingest:instagram -- https://www.instagram.com/p/SHORTCODE/");
} else {
  console.log({ url: sampleUrl, shortcode: getInstagramShortcode(sampleUrl) });
}
