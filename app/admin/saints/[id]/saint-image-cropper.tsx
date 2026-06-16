"use client";

import { Crop, ImagePlus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CSSProperties, PointerEvent } from "react";
import { useMemo, useRef, useState, useTransition } from "react";
import { attachImageToSaint } from "../actions";
import { SaintImageActions } from "./saint-image-actions";

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
  stagedImages: StagedImageSource[];
};

type StagedImageSource = {
  altText?: string | null;
  caption?: string | null;
  id: string;
  sourceUrl?: string | null;
  url: string;
};

type CropBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type DragMode = "move" | "n" | "e" | "s" | "w" | "ne" | "nw" | "se" | "sw";

type DragState = {
  cropBox: CropBox;
  mode: DragMode;
  pointerX: number;
  pointerY: number;
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

const maxCropOutputSize = 1200;
const minCropSize = 8;
const defaultCropBox: CropBox = { x: 10, y: 10, width: 80, height: 80 };
const cropHandles: DragMode[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

export function SaintImageCropper({ defaultAltText, instagramImages, saintId, stagedImages }: SaintImageCropperProps) {
  const [selected, setSelected] = useState<SelectedImage | null>(null);
  const [cropBox, setCropBox] = useState<CropBox>(defaultCropBox);
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });
  const [altText, setAltText] = useState(defaultAltText);
  const [caption, setCaption] = useState("");
  const [credit, setCredit] = useState("");
  const [placement, setPlacement] = useState<"gallery" | "primary" | "both">("gallery");
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const imageRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);

  const sourceOptions = useMemo(() => instagramImages.slice(0, 12), [instagramImages]);
  const isBusy = isPending || uploadState.status === "uploading";
  const imageAspect = naturalSize.width / Math.max(1, naturalSize.height);

  function selectInstagramImage(image: InstagramImageSource) {
    revokeSelectedPreview(selected);
    setSelected({
      sourceUrl: image.sourceUrl,
      label: image.label,
      previewUrl: `/api/admin/media?sourceUrl=${encodeURIComponent(image.sourceUrl)}`
    });
    setCaption(`Image selected from ${image.label}`);
    setCropBox(defaultCropBox);
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
    setCropBox(defaultCropBox);
    setUploadState({ status: "idle" });
  }

  function selectStagedImage(image: StagedImageSource) {
    revokeSelectedPreview(selected);
    setSelected({
      sourceUrl: image.sourceUrl ?? undefined,
      label: image.caption ?? image.altText ?? "Hidden saint image",
      previewUrl: image.url
    });
    setCaption(image.caption ?? "");
    setCropBox(defaultCropBox);
    setUploadState({ status: "idle" });
  }

  async function handleAttachImage() {
    if (!selected || !imageRef.current) return;

    setUploadState({ status: "uploading", message: "Preparing cropped image." });

    try {
      const renderedCrop = await renderCropToBlob(imageRef.current, cropBox);
      const formData = new FormData();
      formData.set("file", new File([renderedCrop.blob], `${slugify(defaultAltText || "saint-image")}.jpg`, { type: "image/jpeg" }));
      formData.set("altText", altText);
      formData.set("caption", caption);
      formData.set("credit", credit);
      formData.set("width", String(renderedCrop.width));
      formData.set("height", String(renderedCrop.height));

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
          router.refresh();
          setUploadState({ status: "success", message: "Image attached to saint review." });
        } catch (error) {
          setUploadState({ status: "error", message: getErrorMessage(error) });
        }
      });
    } catch (error) {
      setUploadState({ status: "error", message: getErrorMessage(error) });
    }
  }

  function startCropDrag(event: PointerEvent<HTMLElement>, mode: DragMode) {
    if (isBusy) return;
    event.preventDefault();
    event.stopPropagation();
    dragStateRef.current = {
      cropBox,
      mode,
      pointerX: event.clientX,
      pointerY: event.clientY
    };
    stageRef.current?.setPointerCapture(event.pointerId);
  }

  function handleCropDrag(event: PointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    const stage = stageRef.current;
    if (!dragState || !stage) return;

    const rect = stage.getBoundingClientRect();
    const deltaX = ((event.clientX - dragState.pointerX) / rect.width) * 100;
    const deltaY = ((event.clientY - dragState.pointerY) / rect.height) * 100;

    setCropBox(resizeCropBox(dragState.cropBox, dragState.mode, deltaX, deltaY));
  }

  function stopCropDrag(event: PointerEvent<HTMLDivElement>) {
    dragStateRef.current = null;
    if (stageRef.current?.hasPointerCapture(event.pointerId)) {
      stageRef.current.releasePointerCapture(event.pointerId);
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
        {stagedImages.length > 0 || sourceOptions.length > 0 ? (
          <div className="saint-image-cropper__source-grid" aria-label="Image staging sources">
            {stagedImages.map((image) => (
              <div className="saint-image-cropper__staged-source" key={image.id}>
                <button className="saint-image-cropper__source" type="button" onClick={() => selectStagedImage(image)}>
                  <img src={image.url} alt="" loading="lazy" />
                  <span>{image.caption ?? image.altText ?? "Hidden saint image"}</span>
                </button>
                <SaintImageActions
                  imageLabel={image.caption ?? image.altText ?? "Hidden saint image"}
                  mediaAssetId={image.id}
                  saintId={saintId}
                  visible={false}
                />
              </div>
            ))}
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
          <div
            className="saint-image-cropper__stage"
            ref={stageRef}
            style={{ "--cropper-aspect": imageAspect } as CSSProperties}
            onPointerMove={handleCropDrag}
            onPointerUp={stopCropDrag}
            onPointerCancel={stopCropDrag}
          >
            <img
              ref={imageRef}
              src={selected.previewUrl}
              alt=""
              onLoad={(event) => {
                setNaturalSize({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight
                });
                setCropBox(defaultCropBox);
              }}
            />
            <div
              className="saint-image-cropper__crop-box"
              style={{
                "--crop-x": `${cropBox.x}%`,
                "--crop-y": `${cropBox.y}%`,
                "--crop-width": `${cropBox.width}%`,
                "--crop-height": `${cropBox.height}%`
              } as CSSProperties}
              onPointerDown={(event) => startCropDrag(event, "move")}
            >
              {cropHandles.map((handle) => (
                <span
                  aria-hidden="true"
                  className="saint-image-cropper__crop-handle"
                  data-handle={handle}
                  key={handle}
                  onPointerDown={(event) => startCropDrag(event, handle)}
                />
              ))}
            </div>
          </div>
          <div className="form-stack saint-image-cropper__controls">
            <div>
              <strong>{selected.label}</strong>
              <p>Drag the crop frame to move it, or drag an edge or corner to resize it.</p>
            </div>
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
}

async function renderCropToBlob(image: HTMLImageElement, cropBox: CropBox) {
  const sourceX = Math.round(image.naturalWidth * cropBox.x / 100);
  const sourceY = Math.round(image.naturalHeight * cropBox.y / 100);
  const sourceWidth = Math.round(image.naturalWidth * cropBox.width / 100);
  const sourceHeight = Math.round(image.naturalHeight * cropBox.height / 100);
  const scale = Math.min(maxCropOutputSize / sourceWidth, maxCropOutputSize / sourceHeight, 1);
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare the image crop.");

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("Could not export the cropped image.");

  return { blob, width, height };
}

function resizeCropBox(initial: CropBox, mode: DragMode, deltaX: number, deltaY: number): CropBox {
  let { x, y, width, height } = initial;

  if (mode === "move") {
    return clampCropBox({
      ...initial,
      x: initial.x + deltaX,
      y: initial.y + deltaY
    });
  }

  if (mode.includes("w")) {
    x = initial.x + deltaX;
    width = initial.width - deltaX;
  }

  if (mode.includes("e")) {
    width = initial.width + deltaX;
  }

  if (mode.includes("n")) {
    y = initial.y + deltaY;
    height = initial.height - deltaY;
  }

  if (mode.includes("s")) {
    height = initial.height + deltaY;
  }

  return clampCropBox({ x, y, width, height });
}

function clampCropBox(cropBox: CropBox): CropBox {
  const width = clamp(cropBox.width, minCropSize, 100);
  const height = clamp(cropBox.height, minCropSize, 100);
  const x = clamp(cropBox.x, 0, 100 - width);
  const y = clamp(cropBox.y, 0, 100 - height);

  return { x, y, width, height };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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
