import type { CSSProperties, ImgHTMLAttributes } from "react";
import type { PublicImage } from "@/lib/public-contracts";

type FocalImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  focalPoint?: PublicImage["focalPoint"];
};

export function FocalImage({ focalPoint, style, ...props }: FocalImageProps) {
  const focalStyle = focalPoint
    ? {
        ...style,
        "--image-object-position": `${focalPoint.x}% ${focalPoint.y}%`
      } as CSSProperties
    : style;

  return <img {...props} style={focalStyle} />;
}
