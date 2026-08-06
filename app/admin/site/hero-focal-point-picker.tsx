"use client";

import type { CSSProperties, Dispatch, KeyboardEvent, PointerEvent, SetStateAction } from "react";
import { useRef, useState } from "react";
import { AdminImageEditorDialog } from "@/components/admin/admin-image-editor-dialog";

type FocalPoint = { x: number; y: number };
type Props = { altText: string; defaultX: number; defaultY: number; imageUrl: string; xName: string; yName: string };

export function HeroFocalPointPicker({ altText, defaultX, defaultY, imageUrl, xName, yName }: Props) {
  const [point, setPoint] = useState({ x: clamp(defaultX), y: clamp(defaultY) });

  return (
    <div className="hero-focal-picker">
      <input name={xName} type="hidden" value={point.x.toFixed(2)} />
      <input name={yName} type="hidden" value={point.y.toFixed(2)} />
      <p className="review-hint">Click, drag, use arrow keys on the image, or use the sliders.</p>
      <HeroFocalStage altText={altText} imageUrl={imageUrl} point={point} setPoint={setPoint} />
      <AdminImageEditorDialog
        description="Click, drag, or use arrow keys to keep the important subject inside the public header crop."
        title={`${altText} focal point`}
      >
        <div className="hero-focal-picker">
          <HeroFocalStage altText={altText} expanded imageUrl={imageUrl} point={point} setPoint={setPoint} />
          <HeroFocalControls point={point} setPoint={setPoint} />
        </div>
      </AdminImageEditorDialog>
      <HeroFocalControls point={point} setPoint={setPoint} />
    </div>
  );
}

function HeroFocalStage({ altText, expanded = false, imageUrl, point, setPoint }: {
  altText: string;
  expanded?: boolean;
  imageUrl: string;
  point: FocalPoint;
  setPoint: Dispatch<SetStateAction<FocalPoint>>;
}) {
  const stageRef = useRef<HTMLButtonElement>(null);
  const style = { "--focal-x": `${point.x}%`, "--focal-y": `${point.y}%` } as CSSProperties;

  function updateFromPointer(event: PointerEvent<HTMLButtonElement>) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (rect) setPoint({ x: clamp((event.clientX - rect.left) / rect.width * 100), y: clamp((event.clientY - rect.top) / rect.height * 100) });
  }

  function updateFromKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
    const step = event.shiftKey ? 5 : 1;
    const delta = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step }
    }[event.key];
    if (!delta) return;
    event.preventDefault();
    setPoint((current) => ({ x: clamp(current.x + delta.x), y: clamp(current.y + delta.y) }));
  }

  return (
    <button
      aria-label={`Choose focal point for ${altText}. Current position ${Math.round(point.x)} percent horizontally and ${Math.round(point.y)} percent vertically.`}
      className={`hero-focal-picker__stage${expanded ? " hero-focal-picker__stage--expanded" : ""}`}
      ref={stageRef}
      style={style}
      type="button"
      onKeyDown={updateFromKeyboard}
      onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); updateFromPointer(event); }}
      onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) updateFromPointer(event); }}
    >
      <img src={imageUrl} alt="" draggable={false} />
      <span className="hero-focal-picker__marker" aria-hidden="true" />
    </button>
  );
}

function HeroFocalControls({ point, setPoint }: {
  point: FocalPoint;
  setPoint: Dispatch<SetStateAction<FocalPoint>>;
}) {
  return (
    <fieldset className="admin-image-adjustment-controls">
      <legend>Keyboard adjustments</legend>
      <label>
        Horizontal focus: {Math.round(point.x)}%
        <input min={0} max={100} type="range" value={point.x} onChange={(event) => setPoint((current) => ({ ...current, x: Number(event.target.value) }))} />
      </label>
      <label>
        Vertical focus: {Math.round(point.y)}%
        <input min={0} max={100} type="range" value={point.y} onChange={(event) => setPoint((current) => ({ ...current, y: Number(event.target.value) }))} />
      </label>
    </fieldset>
  );
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}
