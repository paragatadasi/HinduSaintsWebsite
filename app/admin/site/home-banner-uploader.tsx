"use client";

import { ImagePlus, Upload } from "lucide-react";
import { useState } from "react";

type HomeBannerUploaderProps = {
  defaultBannerImageId?: string;
};

type UploadState = {
  status: "idle" | "uploading" | "success" | "error";
  mediaAssetId?: string;
  message?: string;
};

export function HomeBannerUploader({ defaultBannerImageId = "" }: HomeBannerUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [credit, setCredit] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle", mediaAssetId: defaultBannerImageId });
  const bannerImageId = uploadState.mediaAssetId ?? defaultBannerImageId;
  const isUploading = uploadState.status === "uploading";

  async function handleUpload() {
    if (!file) return;

    setUploadState({ status: "uploading", mediaAssetId: bannerImageId, message: "Uploading banner image." });

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("altText", altText);
      formData.set("caption", caption);
      formData.set("credit", credit);

      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formData
      });
      const payload = await response.json() as { mediaAsset?: { id?: string }; error?: string };

      if (!response.ok || !payload.mediaAsset?.id) {
        throw new Error(payload.error ?? "Image upload failed.");
      }

      setUploadState({
        status: "success",
        mediaAssetId: payload.mediaAsset.id,
        message: "Banner image is ready. Save homepage settings to publish the selection."
      });
      setFile(null);
      setCaption("");
      setCredit("");
    } catch (error) {
      setUploadState({ status: "error", mediaAssetId: bannerImageId, message: getErrorMessage(error) });
    }
  }

  return (
    <div className="form-stack">
      <input name="bannerImageId" type="hidden" value={bannerImageId} />
      <label className="saint-image-cropper__upload">
        <ImagePlus size={18} aria-hidden="true" />
        <span>{file ? file.name : "Upload banner image"}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
      </label>
      <label>
        Alt text
        <input value={altText} maxLength={240} onChange={(event) => setAltText(event.target.value)} />
      </label>
      <label>
        Caption
        <textarea value={caption} maxLength={500} onChange={(event) => setCaption(event.target.value)} />
      </label>
      <label>
        Credit
        <input value={credit} maxLength={160} onChange={(event) => setCredit(event.target.value)} />
      </label>
      <button className="admin-form-button saint-image-cropper__submit" type="button" disabled={!file || isUploading} onClick={handleUpload}>
        <Upload size={16} aria-hidden="true" />
        {isUploading ? "Uploading" : "Upload image"}
      </button>
      {uploadState.message ? (
        <p className={`admin-notice admin-notice--${uploadState.status === "error" ? "warning" : "success"}`}>
          {uploadState.message}
        </p>
      ) : null}
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong while uploading the image.";
}
