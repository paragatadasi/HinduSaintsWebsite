import assert from "node:assert/strict";
import test from "node:test";
import {
  getPublicImageVariants,
  getResponsiveImageSourceSet
} from "./responsive-images";

test("maps validated responsive variants and sorts them by width", () => {
  const variants = getPublicImageVariants([
    { url: "https://media.example/image-960.webp", width: 960, height: 540, storageKey: "ignored" },
    { url: "https://media.example/image-320.webp", width: 320, height: 180 },
    { url: "invalid", width: "640", height: 360 },
    null
  ]);

  assert.deepEqual(variants, [
    { url: "https://media.example/image-320.webp", width: 320, height: 180 },
    { url: "https://media.example/image-960.webp", width: 960, height: 540 }
  ]);
  assert.equal(
    getResponsiveImageSourceSet(variants),
    "https://media.example/image-320.webp 320w, https://media.example/image-960.webp 960w"
  );
});

test("ignores malformed responsive image metadata", () => {
  assert.equal(getPublicImageVariants(null), undefined);
  assert.equal(getPublicImageVariants([{ url: "missing-dimensions" }]), undefined);
});
