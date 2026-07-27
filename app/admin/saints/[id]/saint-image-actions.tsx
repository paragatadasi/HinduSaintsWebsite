"use client";

import { Eye, EyeOff, Pencil, Save, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteSaintImage, updateSaintImageMetadata, updateSaintImagePlacement, updateSaintImageVisibility } from "../actions";

type ImagePlacement = "gallery" | "primary" | "both";
type SelectableImagePlacement = Exclude<ImagePlacement, "primary">;

type SaintImageActionsProps = {
  altText?: string | null;
  caption?: string | null;
  credit?: string | null;
  imageLabel: string;
  mediaAssetId: string;
  saintId: string;
  visible: boolean;
  placement?: ImagePlacement;
};

export function SaintImageActions({
  altText,
  caption,
  credit,
  imageLabel,
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
  const [selectedPlacement, setSelectedPlacement] = useState<SelectableImagePlacement>(
    placement === "primary" ? "both" : placement ?? "gallery"
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
          credit: editedCredit
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
    setIsEditingMetadata(false);
    setMessage(null);
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
