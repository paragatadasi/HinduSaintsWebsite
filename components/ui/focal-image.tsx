import type { CSSProperties, ImgHTMLAttributes } from "react";
import { getFocalObjectPosition } from "@/lib/image-focal-position";
import type { PublicImage } from "@/lib/public-contracts";
import { getResponsiveImageSourceSet } from "@/lib/responsive-images";

type FocalImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  cropAspect?: number;
  focalPoint?: PublicImage["focalPoint"];
  sourceHeight?: number;
  sourceWidth?: number;
  variants?: PublicImage["variants"];
};

export function FocalImage({
  cropAspect = 1,
  focalPoint,
  height,
  sizes = "100vw",
  sourceHeight,
  sourceWidth,
  style,
  variants,
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

  return (
    <img
      {...props}
      decoding={props.decoding ?? "async"}
      height={height}
      loading={props.loading ?? "lazy"}
      sizes={variants?.length ? sizes : undefined}
      srcSet={getResponsiveImageSourceSet(variants)}
      width={width}
      style={focalStyle}
    />
  );
}
