"use client";

import { Eye, EyeOff, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteSaintImage, updateSaintImagePlacement, updateSaintImageVisibility } from "../actions";

type ImagePlacement = "gallery" | "primary" | "both";

type SaintImageActionsProps = {
  imageLabel: string;
  mediaAssetId: string;
  saintId: string;
  visible: boolean;
  placement?: ImagePlacement;
};

export function SaintImageActions({ imageLabel, mediaAssetId, placement, saintId, visible }: SaintImageActionsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [selectedPlacement, setSelectedPlacement] = useState<ImagePlacement>(placement ?? "gallery");
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
      {placement ? (
        <div className="saint-image-actions__placement">
          <label>
            Public placement
            <select
              value={selectedPlacement}
              disabled={isPending}
              onChange={(event) => setSelectedPlacement(event.target.value as ImagePlacement)}
            >
              <option value="primary">Primary only</option>
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
