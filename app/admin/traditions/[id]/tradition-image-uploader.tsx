"use client";

import { MediaBatchUploader } from "@/components/admin/media-batch-uploader";
import { attachImageToTradition } from "../actions";

type TraditionImageUploaderProps = {
  defaultAltText: string;
  traditionId: string;
};

export function TraditionImageUploader({ defaultAltText, traditionId }: TraditionImageUploaderProps) {
  return (
    <MediaBatchUploader
      defaultAltText={defaultAltText}
      allowHero
      attach={(mediaAssetId, placement) => attachImageToTradition({ traditionId, mediaAssetId, placement })}
    />
  );
}
