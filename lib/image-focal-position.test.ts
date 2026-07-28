import assert from "node:assert/strict";
import test from "node:test";
import {
  getFocalObjectPosition,
  getSourceFocalPointFromCropClick
} from "./image-focal-position";

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

test("translates a click in a cropped portrait preview back to source-image coordinates", () => {
  const sourceFocalPoint = { x: 40, y: 11 };
  const objectPosition = getFocalObjectPosition({
    focalPoint: sourceFocalPoint,
    sourceWidth: 531,
    sourceHeight: 800,
    targetAspect: 1
  });

  const result = getSourceFocalPointFromCropClick({
    clickPoint: { x: 40, y: 11 / (531 / 800) },
    objectPosition,
    sourceWidth: 531,
    sourceHeight: 800,
    targetAspect: 1
  });

  assert.equal(result.x, sourceFocalPoint.x);
  assert.ok(Math.abs(result.y - sourceFocalPoint.y) < 0.000001);
});

test("round-trips a centered focal point through a wide cropped preview", () => {
  const sourceFocalPoint = { x: 25, y: 50 };
  const objectPosition = getFocalObjectPosition({
    focalPoint: sourceFocalPoint,
    sourceWidth: 1600,
    sourceHeight: 900,
    targetAspect: 1
  });

  const result = getSourceFocalPointFromCropClick({
    clickPoint: { x: 25 * (1600 / 900), y: 50 },
    objectPosition,
    sourceWidth: 1600,
    sourceHeight: 900,
    targetAspect: 1
  });

  assert.ok(Math.abs(result.x - sourceFocalPoint.x) < 0.000001);
  assert.equal(result.y, sourceFocalPoint.y);
});
