"use client";

import { Eye, EyeOff, Pencil, Save, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CSSProperties, MouseEvent } from "react";
import { useState, useTransition } from "react";
import {
  getFocalObjectPosition,
  getSourceFocalPointFromCropClick
} from "@/lib/image-focal-position";
import { deleteSaintImage, updateSaintImageMetadata, updateSaintImagePlacement, updateSaintImageVisibility } from "../actions";

type ImagePlacement = "gallery" | "primary" | "both";
type SelectableImagePlacement = Exclude<ImagePlacement, "primary">;

type SaintImageActionsProps = {
  altText?: string | null;
  caption?: string | null;
  credit?: string | null;
  focalX?: number | null;
  focalY?: number | null;
  imageLabel: string;
  imageHeight?: number | null;
  imageUrl: string;
  imageWidth?: number | null;
  mediaAssetId: string;
  saintId: string;
  visible: boolean;
  placement?: ImagePlacement;
};

export function SaintImageActions({
  altText,
  caption,
  credit,
  focalX,
  focalY,
  imageHeight,
  imageLabel,
  imageUrl,
  imageWidth,
  mediaAssetId,
  placement,
  saintId,
  visible
}: SaintImageActionsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editedAltText, setEditedAltText] = useState(altText ?? "");
  const [editedCaption, setEditedCaption] = useState(caption ?? "");
  const [editedCredit, setEditedCredit] = useState(credit ?? "");
  const [editedFocalX, setEditedFocalX] = useState(focalX ?? 50);
  const [editedFocalY, setEditedFocalY] = useState(focalY ?? 30);
  const [selectedPlacement, setSelectedPlacement] = useState<SelectableImagePlacement>(
    placement === "primary" ? "both" : placement ?? "gallery"
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const previewObjectPosition = getFocalObjectPosition({
    focalPoint: { x: editedFocalX, y: editedFocalY },
    sourceHeight: imageHeight ?? undefined,
    sourceWidth: imageWidth ?? undefined,
    targetAspect: 1
  });

  function updateVisibility(publicVisible: boolean) {
    setMessage(null);
    startTransition(async () => {
      try {
        await updateSaintImageVisibility({ saintId, mediaAssetId, publicVisible });
        router.refresh();
      } catch (error) {
        setMessage(getErrorMessage(error));
      }
    });
  }

  function savePlacement() {
    if (!placement || selectedPlacement === placement) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await updateSaintImagePlacement({ saintId, mediaAssetId, placement: selectedPlacement });
        setMessage("Placement updated.");
        router.refresh();
      } catch (error) {
        setMessage(getErrorMessage(error));
      }
    });
  }

  function saveMetadata() {
    setMessage(null);
    startTransition(async () => {
      try {
        await updateSaintImageMetadata({
          saintId,
          mediaAssetId,
          altText: editedAltText,
          caption: editedCaption,
          credit: editedCredit,
          focalX: editedFocalX,
          focalY: editedFocalY
        });
        setMessage("Image details updated.");
        setIsEditingMetadata(false);
        router.refresh();
      } catch (error) {
        setMessage(getErrorMessage(error));
      }
    });
  }

  function cancelMetadataEdit() {
    setEditedAltText(altText ?? "");
    setEditedCaption(caption ?? "");
    setEditedCredit(credit ?? "");
    setEditedFocalX(focalX ?? 50);
    setEditedFocalY(focalY ?? 30);
    setIsEditingMetadata(false);
    setMessage(null);
  }

  function setFocusFromPreview(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const sourceFocalPoint = getSourceFocalPointFromCropClick({
      clickPoint: {
        x: (event.clientX - rect.left) / rect.width * 100,
        y: (event.clientY - rect.top) / rect.height * 100
      },
      objectPosition: previewObjectPosition,
      sourceHeight: imageHeight ?? undefined,
      sourceWidth: imageWidth ?? undefined,
      targetAspect: 1
    });

    setEditedFocalX(sourceFocalPoint.x);
    setEditedFocalY(sourceFocalPoint.y);
  }

  function deleteImage() {
    const confirmed = window.confirm(`Delete "${imageLabel}" from this saint? This cannot be undone.`);
    if (!confirmed) return;

    setMessage(null);
    startTransition(async () => {
      try {
        await deleteSaintImage({ saintId, mediaAssetId });
        router.refresh();
      } catch (error) {
        setMessage(getErrorMessage(error));
      }
    });
  }

  return (
    <div className="saint-image-actions">
      {isEditingMetadata ? (
        <div className="saint-image-actions__metadata">
          <label>
            Caption
            <textarea value={editedCaption} maxLength={500} onChange={(event) => setEditedCaption(event.target.value)} />
          </label>
          <label>
            Alt text
            <input value={editedAltText} maxLength={240} onChange={(event) => setEditedAltText(event.target.value)} />
          </label>
          <label>
            Credit
            <input value={editedCredit} maxLength={160} onChange={(event) => setEditedCredit(event.target.value)} />
          </label>
          <div className="saint-image-actions__focus">
            <strong>Card crop focus</strong>
            <p>Click the face to keep it in square and portrait previews.</p>
            <button
              aria-label="Choose the image crop focus"
              className="saint-image-actions__focus-preview"
              type="button"
              onClick={setFocusFromPreview}
            >
              <img
                src={imageUrl}
                alt=""
                style={{
                  "--image-object-position": `${previewObjectPosition.x}% ${previewObjectPosition.y}%`
                } as CSSProperties}
              />
              <span
                aria-hidden="true"
                className="saint-image-actions__focus-marker"
                style={{
                  "--saint-image-focus-x": `${editedFocalX}%`,
                  "--saint-image-focus-y": `${editedFocalY}%`
                } as CSSProperties}
              />
            </button>
            <div className="field-grid">
              <label>
                Horizontal focus: {Math.round(editedFocalX)}%
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editedFocalX}
                  onChange={(event) => setEditedFocalX(Number(event.target.value))}
                />
              </label>
              <label>
                Vertical focus: {Math.round(editedFocalY)}%
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editedFocalY}
                  onChange={(event) => setEditedFocalY(Number(event.target.value))}
                />
              </label>
            </div>
          </div>
          <div className="review-actions">
            <button className="admin-form-button" type="button" disabled={isPending} onClick={saveMetadata}>
              <Save size={16} aria-hidden="true" />
              Save details
            </button>
            <button className="admin-form-button admin-form-button--secondary" type="button" disabled={isPending} onClick={cancelMetadataEdit}>
              <X size={16} aria-hidden="true" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button className="admin-form-button admin-form-button--secondary" type="button" disabled={isPending} onClick={() => setIsEditingMetadata(true)}>
          <Pencil size={16} aria-hidden="true" />
          Edit details
        </button>
      )}
      {placement ? (
        <div className="saint-image-actions__placement">
          <label>
            Public placement
            <select
              value={selectedPlacement}
              disabled={isPending}
              onChange={(event) => setSelectedPlacement(event.target.value as SelectableImagePlacement)}
            >
              <option value="gallery">Gallery only</option>
              <option value="both">Primary and gallery</option>
            </select>
          </label>
          <button
            className="admin-form-button"
            type="button"
            disabled={isPending || selectedPlacement === placement}
            onClick={savePlacement}
          >
            <Save size={16} aria-hidden="true" />
            Save placement
          </button>
        </div>
      ) : null}
      <button className="admin-form-button admin-form-button--secondary" type="button" disabled={isPending} onClick={() => updateVisibility(!visible)}>
        {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        {visible ? "Hide" : "Restore"}
      </button>
      <button className="admin-form-button admin-form-button--warning" type="button" disabled={isPending} onClick={deleteImage}>
        <Trash2 size={16} aria-hidden="true" />
        Delete
      </button>
      {message ? <p className="admin-notice admin-notice--warning">{message}</p> : null}
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Image action failed.";
}

function clampPercentage(value: number) {
  return Math.min(100, Math.max(0, value));
}
