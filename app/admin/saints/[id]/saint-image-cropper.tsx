"use client";

import { ChevronDown, Crop, ImagePlus, ScanFace, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CSSProperties, PointerEvent } from "react";
import { useMemo, useRef, useState, useTransition } from "react";
import { FocalImage } from "@/components/ui/focal-image";
import { attachImageToSaint } from "../actions";
import { InstagramSlideActions } from "./instagram-slide-actions";
import { SaintImageActions } from "./saint-image-actions";

type InstagramImageSource = {
  id: string;
  instagramUrl: string;
  instagramMediaAssetId?: string;
  label: string;
  previewUrl: string;
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
  credit?: string | null;
  focalX?: number | null;
  focalY?: number | null;
  height?: number | null;
  id: string;
  sourceUrl?: string | null;
  url: string;
  width?: number | null;
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

type FocusPoint = {
  x: number;
  y: number;
};

type DetectedFace = {
  boundingBox: {
    height: number;
    width: number;
    x: number;
    y: number;
  };
};

type FaceDetectorConstructor = new (options?: {
  fastMode?: boolean;
  maxDetectedFaces?: number;
}) => {
  detect(source: HTMLImageElement): Promise<DetectedFace[]>;
};

type UploadState = {
  status: "idle" | "uploading" | "success" | "error";
  message?: string;
};

type ImagePlacement = "gallery" | "both";

const maxCropOutputSize = 1200;
const minCropSize = 8;
const instagramSlideBatchSize = 12;
const defaultCropBox: CropBox = { x: 10, y: 10, width: 80, height: 80 };
const defaultFocusPoint: FocusPoint = { x: 50, y: 30 };
const cropHandles: DragMode[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

export function SaintImageCropper({ defaultAltText, instagramImages, saintId, stagedImages }: SaintImageCropperProps) {
  const [selected, setSelected] = useState<SelectedImage | null>(null);
  const [cropBox, setCropBox] = useState<CropBox>(defaultCropBox);
  const [focusPoint, setFocusPoint] = useState<FocusPoint>(defaultFocusPoint);
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });
  const [altText, setAltText] = useState(defaultAltText);
  const [caption, setCaption] = useState("");
  const [credit, setCredit] = useState("");
  const [placement, setPlacement] = useState<ImagePlacement>("both");
  const [visibleInstagramSlideCount, setVisibleInstagramSlideCount] = useState(instagramSlideBatchSize);
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const [smartCropMessage, setSmartCropMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const imageRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const smartCropRequestRef = useRef(0);

  const sourceOptions = useMemo(
    () => instagramImages.slice(0, visibleInstagramSlideCount),
    [instagramImages, visibleInstagramSlideCount]
  );
  const remainingInstagramSlideCount = instagramImages.length - sourceOptions.length;
  const isBusy = isPending || uploadState.status === "uploading";
  const imageAspect = naturalSize.width / Math.max(1, naturalSize.height);

  function selectInstagramImage(image: InstagramImageSource) {
    smartCropRequestRef.current += 1;
    revokeSelectedPreview(selected);
    setSelected({
      sourceUrl: image.sourceUrl,
      label: image.label,
      previewUrl: getCropPreviewUrl(image.previewUrl)
    });
    setCaption("");
    setCropBox(defaultCropBox);
    setFocusPoint(defaultFocusPoint);
    setSmartCropMessage(null);
    setUploadState({ status: "idle" });
  }

  function selectUploadedFile(file: File | undefined) {
    if (!file) return;
    smartCropRequestRef.current += 1;
    revokeSelectedPreview(selected);
    setSelected({
      file,
      label: file.name,
      previewUrl: URL.createObjectURL(file)
    });
    setCaption("");
    setCropBox(defaultCropBox);
    setFocusPoint(defaultFocusPoint);
    setSmartCropMessage(null);
    setUploadState({ status: "idle" });
  }

  function selectStagedImage(image: StagedImageSource) {
    smartCropRequestRef.current += 1;
    revokeSelectedPreview(selected);
    setSelected({
      sourceUrl: image.sourceUrl ?? undefined,
      label: image.caption ?? image.altText ?? "Hidden saint image",
      previewUrl: image.url
    });
    setCaption(image.caption ?? "");
    setCropBox(defaultCropBox);
    setFocusPoint(defaultFocusPoint);
    setSmartCropMessage(null);
    setUploadState({ status: "idle" });
  }

  async function applySmartCrop(image = imageRef.current) {
    if (!image) return;
    const requestId = ++smartCropRequestRef.current;

    const FaceDetector = (window as Window & { FaceDetector?: FaceDetectorConstructor }).FaceDetector;
    if (!FaceDetector) {
      setSmartCropMessage("Automatic face detection is not available in this browser. Keep the face inside the crop frame.");
      return;
    }

    setSmartCropMessage("Finding faces…");

    try {
      const faces = await new FaceDetector({ fastMode: true, maxDetectedFaces: 10 }).detect(image);
      if (smartCropRequestRef.current !== requestId || imageRef.current !== image) return;

      if (faces.length === 0) {
        setSmartCropMessage("No face was detected. Adjust the crop frame manually before attaching.");
        return;
      }

      const smartCrop = getFaceAwareCrop(faces, image.naturalWidth, image.naturalHeight);
      setCropBox(smartCrop.cropBox);
      setFocusPoint(smartCrop.focusPoint);
      setSmartCropMessage(
        faces.length === 1
          ? "Face found. The crop and saved focus have been positioned automatically."
          : `${faces.length} faces found. The crop has been expanded to keep them together.`
      );
    } catch {
      if (smartCropRequestRef.current === requestId && imageRef.current === image) {
        setSmartCropMessage("Face detection could not inspect this image. Adjust the crop frame manually before attaching.");
      }
    }
  }

  async function handleAttachImage() {
    if (!selected || !imageRef.current) return;

    setUploadState({ status: "uploading", message: "Preparing cropped image." });

    try {
      const renderedCrop = await renderCropToBlob(imageRef.current, cropBox, focusPoint);
      const formData = new FormData();
      formData.set("file", new File([renderedCrop.blob], `${slugify(defaultAltText || "saint-image")}.jpg`, { type: "image/jpeg" }));
      formData.set("altText", altText);
      formData.set("caption", caption);
      formData.set("credit", credit);
      formData.set("width", String(renderedCrop.width));
      formData.set("height", String(renderedCrop.height));
      formData.set("focalX", String(renderedCrop.focalX));
      formData.set("focalY", String(renderedCrop.focalY));

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
          <>
            <div className="saint-image-cropper__source-grid" aria-label="Image staging sources">
              {stagedImages.map((image) => (
                <div className="saint-image-cropper__staged-source" key={image.id}>
                  <button className="saint-image-cropper__source" type="button" onClick={() => selectStagedImage(image)}>
                    <FocalImage
                      src={image.url}
                      alt=""
                      width={image.width ?? undefined}
                      height={image.height ?? undefined}
                      focalPoint={image.focalX !== null && image.focalY !== null && image.focalX !== undefined && image.focalY !== undefined
                        ? { x: image.focalX, y: image.focalY }
                        : undefined}
                      loading="lazy"
                    />
                    <span>{image.caption ?? image.altText ?? "Hidden saint image"}</span>
                  </button>
                  <SaintImageActions
                    altText={image.altText}
                    caption={image.caption}
                    credit={image.credit}
                    focalX={image.focalX}
                    focalY={image.focalY}
                    imageHeight={image.height}
                    imageLabel={image.caption ?? image.altText ?? "Hidden saint image"}
                    imageUrl={image.url}
                    imageWidth={image.width}
                    mediaAssetId={image.id}
                    saintId={saintId}
                    visible={false}
                  />
                </div>
              ))}
              {sourceOptions.map((image) => (
                <div className="saint-image-cropper__staged-source" key={`${image.id}-${image.previewUrl}`}>
                  <button className="saint-image-cropper__source" type="button" onClick={() => selectInstagramImage(image)}>
                    <img src={image.previewUrl} alt="" loading="lazy" />
                    <span>{image.label}</span>
                  </button>
                  {image.instagramMediaAssetId ? (
                    <InstagramSlideActions
                      instagramMediaAssetId={image.instagramMediaAssetId}
                      label={image.label}
                      saintId={saintId}
                    />
                  ) : null}
                </div>
              ))}
            </div>
            {remainingInstagramSlideCount > 0 ? (
              <button
                className="admin-form-button admin-form-button--secondary saint-image-cropper__show-more"
                type="button"
                onClick={() => setVisibleInstagramSlideCount((count) => count + instagramSlideBatchSize)}
              >
                <ChevronDown size={16} aria-hidden="true" />
                Show {Math.min(instagramSlideBatchSize, remainingInstagramSlideCount)} more
                <span>({remainingInstagramSlideCount} remaining)</span>
              </button>
            ) : null}
          </>
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
                const nextNaturalSize = {
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight
                };
                setNaturalSize({
                  width: nextNaturalSize.width,
                  height: nextNaturalSize.height
                });
                setCropBox(getDefaultSquareCrop(nextNaturalSize.width, nextNaturalSize.height));
                setFocusPoint(defaultFocusPoint);
                void applySmartCrop(event.currentTarget);
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
              <p>Faces are detected locally when possible. Drag the crop frame to fine-tune the result.</p>
            </div>
            <button
              className="admin-form-button admin-form-button--secondary"
              type="button"
              disabled={isBusy}
              onClick={() => void applySmartCrop()}
            >
              <ScanFace size={16} aria-hidden="true" />
              Find faces
            </button>
            {smartCropMessage ? <p className="admin-notice">{smartCropMessage}</p> : null}
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

async function renderCropToBlob(image: HTMLImageElement, cropBox: CropBox, focusPoint: FocusPoint) {
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

  return {
    blob,
    width,
    height,
    focalX: clamp((focusPoint.x - cropBox.x) / cropBox.width * 100, 0, 100),
    focalY: clamp((focusPoint.y - cropBox.y) / cropBox.height * 100, 0, 100)
  };
}

function getFaceAwareCrop(faces: DetectedFace[], imageWidth: number, imageHeight: number) {
  const left = Math.min(...faces.map((face) => face.boundingBox.x));
  const top = Math.min(...faces.map((face) => face.boundingBox.y));
  const right = Math.max(...faces.map((face) => face.boundingBox.x + face.boundingBox.width));
  const bottom = Math.max(...faces.map((face) => face.boundingBox.y + face.boundingBox.height));
  const focusPoint = {
    x: (left + right) / 2 / imageWidth * 100,
    y: (top + bottom) / 2 / imageHeight * 100
  };
  const faceWidth = right - left;
  const faceHeight = bottom - top;
  const cropSize = Math.min(
    Math.min(imageWidth, imageHeight),
    Math.max(Math.min(imageWidth, imageHeight) * 0.8, faceWidth * 1.5, faceHeight * 1.7)
  );
  const width = cropSize / imageWidth * 100;
  const height = cropSize / imageHeight * 100;

  return {
    cropBox: clampCropBox({
      x: focusPoint.x - width / 2,
      y: focusPoint.y - height / 2,
      width,
      height
    }),
    focusPoint
  };
}

function getDefaultSquareCrop(imageWidth: number, imageHeight: number): CropBox {
  const cropSize = Math.min(imageWidth, imageHeight) * 0.8;
  const width = cropSize / imageWidth * 100;
  const height = cropSize / imageHeight * 100;

  return clampCropBox({
    x: defaultFocusPoint.x - width / 2,
    y: defaultFocusPoint.y - height / 2,
    width,
    height
  });
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

function getCropPreviewUrl(sourceUrl: string) {
  return sourceUrl.startsWith("/")
    ? sourceUrl
    : `/api/admin/media?sourceUrl=${encodeURIComponent(sourceUrl)}`;
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
