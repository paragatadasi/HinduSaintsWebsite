"use client";

import { Crop, ImagePlus, Upload } from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useRef, useState, useTransition } from "react";
import { attachImageToSaint } from "../actions";

type InstagramImageSource = {
  id: string;
  instagramUrl: string;
  label: string;
  sourceUrl: string;
};

type SaintImageCropperProps = {
  defaultAltText: string;
  instagramImages: InstagramImageSource[];
  saintId: string;
};

type CropBox = {
  x: number;
  y: number;
  size: number;
};

type SelectedImage = {
  file?: File;
  sourceUrl?: string;
  label: string;
  previewUrl: string;
};

type UploadState = {
  status: "idle" | "uploading" | "success" | "error";
  message?: string;
};

const cropCanvasSize = 1200;

export function SaintImageCropper({ defaultAltText, instagramImages, saintId }: SaintImageCropperProps) {
  const [selected, setSelected] = useState<SelectedImage | null>(null);
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, size: 100 });
  const [altText, setAltText] = useState(defaultAltText);
  const [caption, setCaption] = useState("");
  const [credit, setCredit] = useState("");
  const [placement, setPlacement] = useState<"gallery" | "primary" | "both">("gallery");
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();
  const imageRef = useRef<HTMLImageElement>(null);

  const sourceOptions = useMemo(() => instagramImages.slice(0, 12), [instagramImages]);
  const isBusy = isPending || uploadState.status === "uploading";

  function selectInstagramImage(image: InstagramImageSource) {
    revokeSelectedPreview(selected);
    setSelected({
      sourceUrl: image.sourceUrl,
      label: image.label,
      previewUrl: `/api/admin/media?sourceUrl=${encodeURIComponent(image.sourceUrl)}`
    });
    setCaption(`Image selected from ${image.label}`);
    setCropBox({ x: 0, y: 0, size: 100 });
    setUploadState({ status: "idle" });
  }

  function selectUploadedFile(file: File | undefined) {
    if (!file) return;
    revokeSelectedPreview(selected);
    setSelected({
      file,
      label: file.name,
      previewUrl: URL.createObjectURL(file)
    });
    setCaption("");
    setCropBox({ x: 0, y: 0, size: 100 });
    setUploadState({ status: "idle" });
  }

  async function handleAttachImage() {
    if (!selected || !imageRef.current) return;

    setUploadState({ status: "uploading", message: "Preparing cropped image." });

    try {
      const blob = await renderCropToBlob(imageRef.current, cropBox);
      const formData = new FormData();
      formData.set("file", new File([blob], `${slugify(defaultAltText || "saint-image")}.jpg`, { type: "image/jpeg" }));
      formData.set("altText", altText);
      formData.set("caption", caption);
      formData.set("credit", credit);
      formData.set("width", String(cropCanvasSize));
      formData.set("height", String(cropCanvasSize));

      if (selected.sourceUrl) {
        formData.set("sourceUrl", selected.sourceUrl);
      }

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
          await attachImageToSaint({
            saintId,
            mediaAssetId: payload.mediaAsset!.id!,
            placement
          });
          setUploadState({ status: "success", message: "Image attached to saint review." });
        } catch (error) {
          setUploadState({ status: "error", message: getErrorMessage(error) });
        }
      });
    } catch (error) {
      setUploadState({ status: "error", message: getErrorMessage(error) });
    }
  }

  return (
    <div className="saint-image-cropper">
      <div className="saint-image-cropper__sources">
        <label className="saint-image-cropper__upload">
          <ImagePlus size={18} aria-hidden="true" />
          <span>Upload image</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectUploadedFile(event.target.files?.[0])} />
        </label>
        {sourceOptions.length > 0 ? (
          <div className="saint-image-cropper__source-grid" aria-label="Instagram post images">
            {sourceOptions.map((image) => (
              <button className="saint-image-cropper__source" key={`${image.id}-${image.sourceUrl}`} type="button" onClick={() => selectInstagramImage(image)}>
                <img src={image.sourceUrl} alt="" loading="lazy" />
                <span>{image.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <p>No attached Instagram post images are available yet.</p>
        )}
      </div>

      {selected ? (
        <div className="saint-image-cropper__workspace">
          <div className="saint-image-cropper__stage">
            <img
              ref={imageRef}
              src={selected.previewUrl}
              alt=""
            />
            <div
              className="saint-image-cropper__crop-box"
              style={{
                "--crop-x": `${cropBox.x}%`,
                "--crop-y": `${cropBox.y}%`,
                "--crop-size": `${cropBox.size}%`
              } as CSSProperties}
            />
          </div>
          <div className="form-stack saint-image-cropper__controls">
            <div>
              <strong>{selected.label}</strong>
              <p>Adjust the crop, then attach the cropped image to this saint.</p>
            </div>
            <label>
              Crop size
              <input type="range" min="35" max="100" value={cropBox.size} onChange={(event) => updateCrop("size", Number(event.target.value))} />
            </label>
            <label>
              Horizontal position
              <input type="range" min="0" max={100 - cropBox.size} value={cropBox.x} onChange={(event) => updateCrop("x", Number(event.target.value))} />
            </label>
            <label>
              Vertical position
              <input type="range" min="0" max={100 - cropBox.size} value={cropBox.y} onChange={(event) => updateCrop("y", Number(event.target.value))} />
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
                <option value="primary">Primary image</option>
                <option value="both">Primary and gallery</option>
              </select>
            </label>
            <button className="admin-form-button saint-image-cropper__submit" type="button" disabled={isBusy} onClick={handleAttachImage}>
              {isBusy ? <Crop size={16} aria-hidden="true" /> : <Upload size={16} aria-hidden="true" />}
              {isBusy ? "Attaching" : "Crop and attach"}
            </button>
            {uploadState.message ? (
              <p className={`admin-notice admin-notice--${uploadState.status === "error" ? "warning" : "success"}`}>
                {uploadState.message}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );

  function updateCrop(key: keyof CropBox, value: number) {
    setCropBox((current) => {
      const next = { ...current, [key]: value };
      const maxOffset = 100 - next.size;
      return {
        size: next.size,
        x: Math.min(next.x, maxOffset),
        y: Math.min(next.y, maxOffset)
      };
    });
  }
}

async function renderCropToBlob(image: HTMLImageElement, cropBox: CropBox) {
  const canvas = document.createElement("canvas");
  canvas.width = cropCanvasSize;
  canvas.height = cropCanvasSize;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare the image crop.");

  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight) * (cropBox.size / 100);
  const sourceX = (image.naturalWidth - sourceSize) * (cropBox.x / Math.max(1, 100 - cropBox.size));
  const sourceY = (image.naturalHeight - sourceSize) * (cropBox.y / Math.max(1, 100 - cropBox.size));

  context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, cropCanvasSize, cropCanvasSize);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("Could not export the cropped image.");

  return blob;
}

function revokeSelectedPreview(selected: SelectedImage | null) {
  if (selected?.file) {
    URL.revokeObjectURL(selected.previewUrl);
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "saint-image";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong while attaching the image.";
}
