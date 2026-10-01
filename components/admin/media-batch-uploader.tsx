"use client";

import { ImagePlus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type UploadItem = {
  file: File;
  mediaAssetId?: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
};

type Props = {
  defaultAltText: string;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  onSelectSingle?: (file: File) => void;
  attach: (mediaAssetId: string, placement: "gallery" | "hero" | "both") => Promise<void>;
  allowHero?: boolean;
};

export function MediaBatchUploader({ defaultAltText, disabled, onBusyChange, onSelectSingle, attach, allowHero }: Props) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const [altText, setAltText] = useState(defaultAltText);
  const [caption, setCaption] = useState("");
  const [credit, setCredit] = useState("");
  const [placement, setPlacement] = useState<"gallery" | "hero" | "both">("gallery");
  const router = useRouter();
  const locked = busy || disabled;
  const remaining = items.filter((item) => item.status !== "success").length;
  const completed = items.length - remaining;

  async function upload() {
    if (running.current || disabled || !remaining) return;
    running.current = true;
    setBusy(true);
    onBusyChange?.(true);
    const next = items.map((item) => ({ ...item }));
    try {
      // Sequential requests preserve gallery order and each file's existing upload limit.
      for (const item of next) {
        if (item.status === "success") continue;
        item.status = "uploading";
        item.error = undefined;
        setItems(next.map((entry) => ({ ...entry })));
        try {
          // Keep an uploaded asset when attachment fails, so retry does not upload it again.
          if (!item.mediaAssetId) {
            const data = new FormData();
            data.set("file", item.file);
            data.set("altText", altText);
            data.set("caption", caption);
            data.set("credit", credit);
            const response = await fetch("/api/admin/media", { method: "POST", body: data });
            const payload = await response.json() as { mediaAsset?: { id?: string }; error?: string };
            if (!response.ok || !payload.mediaAsset?.id) {
              throw new Error(payload.error ?? "Image upload failed.");
            }
            item.mediaAssetId = payload.mediaAsset.id;
          }
          await attach(item.mediaAssetId, next.length > 1 ? "gallery" : placement);
          item.status = "success";
        } catch (error) {
          item.status = "error";
          item.error = error instanceof Error ? error.message : "Image upload failed. Please retry.";
        }
        setItems(next.map((entry) => ({ ...entry })));
      }
    } finally {
      running.current = false;
      setBusy(false);
      onBusyChange?.(false);
      router.refresh();
    }
  }

  return (
    <div className="form-stack">
      <label className="saint-image-cropper__upload">
        <ImagePlus size={18} aria-hidden="true" />
        <span>Select photos from computer</span>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          disabled={locked}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (!files.length) return;
            setItems([]);
            if (files.length === 1 && onSelectSingle) {
              onSelectSingle(files[0]);
              return;
            }
            setItems(files.map((file) => ({ file, status: "pending" })));
          }}
        />
      </label>
      <p className="empty-note">Select several JPEG, PNG, or WebP photos to upload together to the gallery. {onSelectSingle ? "Select one photo to crop it before attaching." : "Select one photo to choose hero placement."}</p>
      {items.length > 0 ? (
        <>
          <p className="empty-note">Alt text, caption, and credit apply to every selected photo. You can edit each photo after uploading.</p>
          <label>Alt text<input value={altText} maxLength={240} disabled={locked || items.some((item) => Boolean(item.mediaAssetId))} onChange={(event) => setAltText(event.target.value)} /></label>
          <label>Caption<textarea value={caption} maxLength={500} disabled={locked || items.some((item) => Boolean(item.mediaAssetId))} onChange={(event) => setCaption(event.target.value)} /></label>
          <label>Credit<input value={credit} maxLength={160} disabled={locked || items.some((item) => Boolean(item.mediaAssetId))} onChange={(event) => setCredit(event.target.value)} /></label>
          {allowHero && items.length === 1 ? (
            <label>Placement
              <select value={placement} disabled={locked || completed > 0} onChange={(event) => setPlacement(event.target.value as typeof placement)}>
                <option value="gallery">Gallery image</option>
                <option value="hero">Hero image</option>
                <option value="both">Hero and gallery</option>
              </select>
            </label>
          ) : null}
          <ul>
            {items.map((item, index) => (
              <li key={index}>
                {item.file.name} — {item.status === "success" ? "Attached" : item.status === "uploading" ? "Uploading…" : item.status === "error" ? item.error : "Ready"}
              </li>
            ))}
          </ul>
          <p className="admin-notice" role="status">{completed} of {items.length} photos attached{busy ? ". Uploading…" : "."}{items.some((item) => item.status === "error") && !busy ? " Some photos failed. Retry the remaining photos below." : ""}</p>
          {remaining > 0 ? (
            <button className="admin-form-button saint-image-cropper__submit" type="button" disabled={locked} onClick={() => void upload()}>
              <Upload size={16} aria-hidden="true" />
              {busy ? "Uploading…" : items.some((item) => item.status === "error") ? "Retry remaining photos" : `Upload and attach ${remaining} ${remaining === 1 ? "photo" : "photos"}`}
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
