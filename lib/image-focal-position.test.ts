import assert from "node:assert/strict";
import test from "node:test";
import { getFocalObjectPosition } from "./image-focal-position";

test("top-aligns a tall portrait when its focal point is above the visible square", () => {
  assert.deepEqual(
    getFocalObjectPosition({
      focalPoint: { x: 50, y: 30 },
      sourceWidth: 447,
      sourceHeight: 675,
      targetAspect: 1
    }),
    { x: 50, y: 0 }
  );
});

test("centers a middle focal point in a tall portrait", () => {
  assert.deepEqual(
    getFocalObjectPosition({
      focalPoint: { x: 50, y: 50 },
      sourceWidth: 400,
      sourceHeight: 600,
      targetAspect: 1
    }),
    { x: 50, y: 50 }
  );
});

test("left-aligns a wide image when its focal point is near the left edge", () => {
  assert.deepEqual(
    getFocalObjectPosition({
      focalPoint: { x: 25, y: 50 },
      sourceWidth: 1600,
      sourceHeight: 900,
      targetAspect: 1
    }),
    { x: 0, y: 50 }
  );
});

test("uses a top-safe portrait fallback when source dimensions are unavailable", () => {
  assert.deepEqual(
    getFocalObjectPosition({
      focalPoint: { x: 42, y: 18 }
    }),
    { x: 42, y: 0 }
  );
});
