import type { CSSProperties, ImgHTMLAttributes } from "react";
import { getFocalObjectPosition } from "@/lib/image-focal-position";
import type { PublicImage } from "@/lib/public-contracts";

type FocalImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  cropAspect?: number;
  focalPoint?: PublicImage["focalPoint"];
  sourceHeight?: number;
  sourceWidth?: number;
};

export function FocalImage({
  cropAspect = 1,
  focalPoint,
  height,
  sourceHeight,
  sourceWidth,
  style,
  width,
  ...props
}: FocalImageProps) {
  const objectPosition = focalPoint
    ? getFocalObjectPosition({
        focalPoint,
        sourceHeight: sourceHeight ?? height,
        sourceWidth: sourceWidth ?? width,
        targetAspect: cropAspect
      })
    : undefined;
  const focalStyle = objectPosition
    ? {
        ...style,
        "--image-object-position": `${objectPosition.x}% ${objectPosition.y}%`
      } as CSSProperties
    : style;

  return <img {...props} height={height} width={width} style={focalStyle} />;
}
