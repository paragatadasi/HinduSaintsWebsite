"use client";

import { Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteAttachedInstagramSlide } from "../actions";

type InstagramSlideActionsProps = {
  instagramMediaAssetId: string;
  label: string;
  saintId: string;
};

export function InstagramSlideActions({ instagramMediaAssetId, label, saintId }: InstagramSlideActionsProps) {
  const [isArmed, setIsArmed] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function removeSlide() {
    if (!password) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await deleteAttachedInstagramSlide({ instagramMediaAssetId, password, saintId });
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Instagram slide removal failed.");
      }
    });
  }

  if (!isArmed) {
    return (
      <button className="admin-form-button admin-form-button--low-priority" type="button" onClick={() => setIsArmed(true)}>
        <Trash2 size={16} aria-hidden="true" />
        Remove slide
      </button>
    );
  }

  return (
    <div className="instagram-slide-actions">
      <label>
        Delete password
        <input
          aria-label={`Delete password for ${label}`}
          autoComplete="off"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <div className="review-actions">
        <button className="admin-form-button admin-form-button--warning" type="button" disabled={isPending || !password} onClick={removeSlide}>
          <Trash2 size={16} aria-hidden="true" />
          {isPending ? "Removing" : "Confirm removal"}
        </button>
        <button className="admin-form-button admin-form-button--secondary" type="button" disabled={isPending} onClick={() => setIsArmed(false)}>
          <X size={16} aria-hidden="true" />
          Cancel
        </button>
      </div>
      {message ? <p className="admin-notice admin-notice--warning">{message}</p> : null}
    </div>
  );
}
