export type ImageFocalPoint = {
  x: number;
  y: number;
};

const defaultSaintFocalPoint: ImageFocalPoint = {
  x: 50,
  y: 30
};

type FocalObjectPositionInput = {
  focalPoint: ImageFocalPoint;
  sourceHeight?: number | string;
  sourceWidth?: number | string;
  targetAspect?: number;
};

type SourceFocalPointInput = {
  clickPoint: ImageFocalPoint;
  objectPosition: ImageFocalPoint;
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
    if (isDefaultSaintFocalPoint(normalizedFocalPoint)) {
      return { x: 50, y: 0 };
    }

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

export function getSourceFocalPointFromCropClick({
  clickPoint,
  objectPosition,
  sourceHeight,
  sourceWidth,
  targetAspect = 1
}: SourceFocalPointInput): ImageFocalPoint {
  const normalizedClickPoint = {
    x: clampPercentage(clickPoint.x),
    y: clampPercentage(clickPoint.y)
  };
  const width = Number(sourceWidth);
  const height = Number(sourceHeight);

  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0 || targetAspect <= 0) {
    return normalizedClickPoint;
  }

  const sourceAspect = width / height;
  if (Math.abs(sourceAspect - targetAspect) < 0.001) {
    return normalizedClickPoint;
  }

  if (sourceAspect < targetAspect) {
    return {
      x: normalizedClickPoint.x,
      y: getSourceAxisPosition(
        normalizedClickPoint.y,
        objectPosition.y,
        targetAspect / sourceAspect
      )
    };
  }

  return {
    x: getSourceAxisPosition(
      normalizedClickPoint.x,
      objectPosition.x,
      sourceAspect / targetAspect
    ),
    y: normalizedClickPoint.y
  };
}

function isDefaultSaintFocalPoint(focalPoint: ImageFocalPoint) {
  return (
    Math.abs(focalPoint.x - defaultSaintFocalPoint.x) < 0.001
    && Math.abs(focalPoint.y - defaultSaintFocalPoint.y) < 0.001
  );
}

function getOverflowAxisPosition(focalPercentage: number, renderedToContainerRatio: number) {
  const focalRatio = focalPercentage / 100;
  const overflowRatio = renderedToContainerRatio - 1;

  if (overflowRatio <= 0) return 50;

  return clampPercentage(
    (focalRatio * renderedToContainerRatio - 0.5) / overflowRatio * 100
  );
}

function getSourceAxisPosition(
  clickPercentage: number,
  objectPositionPercentage: number,
  renderedToContainerRatio: number
) {
  const clickRatio = clickPercentage / 100;
  const objectPositionRatio = clampPercentage(objectPositionPercentage) / 100;
  const sourceRatio = (
    clickRatio - (1 - renderedToContainerRatio) * objectPositionRatio
  ) / renderedToContainerRatio;

  return clampPercentage(sourceRatio * 100);
}

function clampPercentage(value: number) {
  return Math.min(100, Math.max(0, value));
}
