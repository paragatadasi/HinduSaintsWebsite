import assert from "node:assert/strict";
import test from "node:test";
import { getSocialImage } from "@/lib/social-metadata";

test("builds a cropped JPEG URL for a configured managed hero image", () => {
  assert.deepEqual(getSocialImage({
    url: "/media/home-hero.png",
    width: 1800,
    height: 900,
    alt: ""
  }, {
    fallbackAlt: "Homepage hero",
    focalPoint: { x: 83.641, y: 34.109 },
    optimizeManagedImage: true
  }), {
    url: "/social-image/home-hero.png/preview.jpg?x=83.64&y=34.11",
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: "Homepage hero"
  });
});

test("falls back to the optimized static share image", () => {
  assert.deepEqual(getSocialImage(), {
    url: "/images/hindu-saints-share.jpg",
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: "A devotee meditating beside a sacred river at night"
  });
});
