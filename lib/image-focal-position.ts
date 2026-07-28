export type ImageFocalPoint = {
  x: number;
  y: number;
};

type FocalObjectPositionInput = {
  focalPoint: ImageFocalPoint;
  sourceHeight?: number | string;
  sourceWidth?: number | string;
  targetAspect?: number;
};

export function getFocalObjectPosition({
  focalPoint,
  sourceHeight,
  sourceWidth,
  targetAspect = 1
}: FocalObjectPositionInput): ImageFocalPoint {
  const normalizedFocalPoint = {
    x: clampPercentage(focalPoint.x),
    y: clampPercentage(focalPoint.y)
  };
  const width = Number(sourceWidth);
  const height = Number(sourceHeight);

  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0 || targetAspect <= 0) {
    return {
      x: normalizedFocalPoint.x,
      y: clampPercentage(normalizedFocalPoint.y - 30)
    };
  }

  const sourceAspect = width / height;
  if (Math.abs(sourceAspect - targetAspect) < 0.001) {
    return { x: 50, y: 50 };
  }

  if (sourceAspect < targetAspect) {
    return {
      x: 50,
      y: getOverflowAxisPosition(normalizedFocalPoint.y, targetAspect / sourceAspect)
    };
  }

  return {
    x: getOverflowAxisPosition(normalizedFocalPoint.x, sourceAspect / targetAspect),
    y: 50
  };
}

function getOverflowAxisPosition(focalPercentage: number, renderedToContainerRatio: number) {
  const focalRatio = focalPercentage / 100;
  const overflowRatio = renderedToContainerRatio - 1;

  if (overflowRatio <= 0) return 50;

  return clampPercentage(
    (focalRatio * renderedToContainerRatio - 0.5) / overflowRatio * 100
  );
}

function clampPercentage(value: number) {
  return Math.min(100, Math.max(0, value));
}
