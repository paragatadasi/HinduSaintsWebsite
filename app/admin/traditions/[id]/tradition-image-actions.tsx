"use client";

import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteTraditionImage, updateTraditionImageVisibility } from "../actions";

type TraditionImageActionsProps = {
  imageLabel: string;
  mediaAssetId: string;
  traditionId: string;
  visible: boolean;
};

export function TraditionImageActions({ imageLabel, mediaAssetId, traditionId, visible }: TraditionImageActionsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function updateVisibility(publicVisible: boolean) {
    setMessage(null);
    startTransition(async () => {
      try {
        await updateTraditionImageVisibility({ traditionId, mediaAssetId, publicVisible });
        router.refresh();
      } catch (error) {
        setMessage(getErrorMessage(error));
      }
    });
  }

  function deleteImage() {
    const confirmed = window.confirm(`Delete "${imageLabel}" from this tradition? This cannot be undone.`);
    if (!confirmed) return;

    setMessage(null);
    startTransition(async () => {
      try {
        await deleteTraditionImage({ traditionId, mediaAssetId });
        router.refresh();
      } catch (error) {
        setMessage(getErrorMessage(error));
      }
    });
  }

  return (
    <div className="saint-image-actions">
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
