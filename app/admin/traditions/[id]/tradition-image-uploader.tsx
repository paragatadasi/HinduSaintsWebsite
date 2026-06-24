"use client";

import { ImagePlus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { attachImageToTradition } from "../actions";

type TraditionImageUploaderProps = {
  defaultAltText: string;
  traditionId: string;
};

type UploadState = {
  status: "idle" | "uploading" | "success" | "error";
  message?: string;
};

export function TraditionImageUploader({ defaultAltText, traditionId }: TraditionImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState(defaultAltText);
  const [caption, setCaption] = useState("");
  const [credit, setCredit] = useState("");
  const [placement, setPlacement] = useState<"gallery" | "hero" | "both">("gallery");
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isBusy = isPending || uploadState.status === "uploading";

  async function handleUpload() {
    if (!file) return;

    setUploadState({ status: "uploading", message: "Uploading image." });

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

      startTransition(async () => {
        try {
          await attachImageToTradition({
            traditionId,
            mediaAssetId: payload.mediaAsset!.id!,
            placement
          });
          router.refresh();
          setUploadState({ status: "success", message: "Image attached to tradition gallery." });
          setFile(null);
          setCaption("");
          setCredit("");
        } catch (error) {
          setUploadState({ status: "error", message: getErrorMessage(error) });
        }
      });
    } catch (error) {
      setUploadState({ status: "error", message: getErrorMessage(error) });
    }
  }

  return (
    <div className="form-stack">
      <label className="saint-image-cropper__upload">
        <ImagePlus size={18} aria-hidden="true" />
        <span>{file ? file.name : "Upload tradition image"}</span>
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
      <label>
        Placement
        <select value={placement} onChange={(event) => setPlacement(event.target.value as typeof placement)}>
          <option value="gallery">Gallery image</option>
          <option value="hero">Hero image</option>
          <option value="both">Hero and gallery</option>
        </select>
      </label>
      <button className="admin-form-button saint-image-cropper__submit" type="button" disabled={!file || isBusy} onClick={handleUpload}>
        <Upload size={16} aria-hidden="true" />
        {isBusy ? "Attaching" : "Upload and attach"}
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
  return error instanceof Error ? error.message : "Something went wrong while attaching the image.";
}
