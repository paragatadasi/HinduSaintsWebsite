"use client";

import type { CSSProperties, Dispatch, PointerEvent, SetStateAction } from "react";
import { useRef, useState } from "react";
import { AdminImageEditorDialog } from "@/components/admin/admin-image-editor-dialog";

type FocalArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type FocalBox = FocalArea;
type DragMode = "move" | "n" | "e" | "s" | "w" | "ne" | "nw" | "se" | "sw";

type DragState = {
  box: FocalBox;
  mode: DragMode;
  pointerX: number;
  pointerY: number;
};

type HomeBannerFocalPickerProps = {
  altText: string;
  defaultArea: FocalArea;
  fieldNamePrefix?: string;
  imageUrl: string;
};

const minFocalSize = 10;
const focalHandles: DragMode[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

export function HomeBannerFocalPicker({
  altText,
  defaultArea,
  fieldNamePrefix = "bannerFocal",
  imageUrl
}: HomeBannerFocalPickerProps) {
  const [area, setArea] = useState(() => normalizeArea(defaultArea));

  return (
    <div className="home-focal-picker">
      <input name={`${fieldNamePrefix}X`} type="hidden" value={formatPercent(area.x)} />
      <input name={`${fieldNamePrefix}Y`} type="hidden" value={formatPercent(area.y)} />
      <input name={`${fieldNamePrefix}Width`} type="hidden" value={formatPercent(area.width)} />
      <input name={`${fieldNamePrefix}Height`} type="hidden" value={formatPercent(area.height)} />

      <p className="review-hint">Drag the frame to compose the banner. Open the larger editor for precise adjustments.</p>
      <FocalStage altText={altText} area={area} imageUrl={imageUrl} setArea={setArea} />
      <AdminImageEditorDialog
        description="Drag the crop frame or use the sliders. Changes stay synchronized with the compact editor."
        title="Homepage banner focal area"
      >
        <div className="home-focal-picker">
          <FocalStage altText={altText} area={area} expanded imageUrl={imageUrl} setArea={setArea} />
          <FocalControls area={area} setArea={setArea} />
        </div>
      </AdminImageEditorDialog>
    </div>
  );
}

function FocalStage({ altText, area, expanded = false, imageUrl, setArea }: {
  altText: string;
  area: FocalArea;
  expanded?: boolean;
  imageUrl: string;
  setArea: Dispatch<SetStateAction<FocalArea>>;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const box = areaToBox(area);
  const selectionStyle = {
    "--focal-x": `${box.x}%`,
    "--focal-y": `${box.y}%`,
    "--focal-width": `${box.width}%`,
    "--focal-height": `${box.height}%`
  } as CSSProperties;

  function startFocalDrag(event: PointerEvent<HTMLElement>, mode: DragMode, initialBox = box) {
    event.preventDefault();
    event.stopPropagation();
    dragStateRef.current = { box: initialBox, mode, pointerX: event.clientX, pointerY: event.clientY };
    stageRef.current?.setPointerCapture(event.pointerId);
  }

  function getRepositionedBox(event: PointerEvent<HTMLDivElement>) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return box;
    const nextX = (event.clientX - rect.left) / rect.width * 100;
    const nextY = (event.clientY - rect.top) / rect.height * 100;
    return clampFocalBox({ ...box, x: nextX - box.width / 2, y: nextY - box.height / 2 });
  }

  function handleFocalDrag(event: PointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!dragState || !rect) return;
    const deltaX = (event.clientX - dragState.pointerX) / rect.width * 100;
    const deltaY = (event.clientY - dragState.pointerY) / rect.height * 100;
    setArea(boxToArea(resizeFocalBox(dragState.box, dragState.mode, deltaX, deltaY)));
  }

  function stopFocalDrag(event: PointerEvent<HTMLDivElement>) {
    dragStateRef.current = null;
    if (stageRef.current?.hasPointerCapture(event.pointerId)) stageRef.current.releasePointerCapture(event.pointerId);
  }

  return (
    <div
      className={`home-focal-picker__stage${expanded ? " home-focal-picker__stage--expanded" : ""}`}
      ref={stageRef}
      style={selectionStyle}
      onPointerDown={(event) => {
        const nextBox = getRepositionedBox(event);
        setArea(boxToArea(nextBox));
        startFocalDrag(event, "move", nextBox);
      }}
      onPointerMove={handleFocalDrag}
      onPointerUp={stopFocalDrag}
      onPointerCancel={stopFocalDrag}
    >
      <img src={imageUrl} alt={altText} />
      <div className="home-focal-picker__selection" aria-hidden="true" onPointerDown={(event) => startFocalDrag(event, "move")}>
        {focalHandles.map((handle) => (
          <span className="home-focal-picker__handle" data-handle={handle} key={handle} onPointerDown={(event) => startFocalDrag(event, handle)} />
        ))}
      </div>
    </div>
  );
}

function FocalControls({ area, setArea }: {
  area: FocalArea;
  setArea: Dispatch<SetStateAction<FocalArea>>;
}) {
  function updateArea(key: keyof FocalArea, value: number) {
    setArea((current) => normalizeArea({ ...current, [key]: value }));
  }

  return (
    <fieldset className="admin-image-adjustment-controls">
      <legend>Precise adjustments</legend>
      <RangeControl label="Horizontal center" value={area.x} onChange={(value) => updateArea("x", value)} />
      <RangeControl label="Vertical center" value={area.y} onChange={(value) => updateArea("y", value)} />
      <RangeControl label="Frame width" min={minFocalSize} value={area.width} onChange={(value) => updateArea("width", value)} />
      <RangeControl label="Frame height" min={minFocalSize} value={area.height} onChange={(value) => updateArea("height", value)} />
    </fieldset>
  );
}

function RangeControl({ label, min = 0, onChange, value }: {
  label: string;
  min?: number;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label>
      {label}: {Math.round(value)}%
      <input min={min} max={100} step={1} type="range" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function normalizeArea(area: FocalArea): FocalArea {
  return boxToArea(clampFocalBox(areaToBox({ x: clamp(area.x, 0, 100), y: clamp(area.y, 0, 100), width: area.width, height: area.height })));
}

function areaToBox(area: FocalArea): FocalBox {
  const width = clamp(area.width, minFocalSize, 100);
  const height = clamp(area.height, minFocalSize, 100);
  return { x: area.x - width / 2, y: area.y - height / 2, width, height };
}

function boxToArea(box: FocalBox): FocalArea {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, width: box.width, height: box.height };
}

function resizeFocalBox(initial: FocalBox, mode: DragMode, deltaX: number, deltaY: number): FocalBox {
  let { x, y, width, height } = initial;
  if (mode === "move") return clampFocalBox({ ...initial, x: initial.x + deltaX, y: initial.y + deltaY });
  if (mode.includes("w")) { x = initial.x + deltaX; width = initial.width - deltaX; }
  if (mode.includes("e")) width = initial.width + deltaX;
  if (mode.includes("n")) { y = initial.y + deltaY; height = initial.height - deltaY; }
  if (mode.includes("s")) height = initial.height + deltaY;
  return clampFocalBox({ x, y, width, height });
}

function clampFocalBox(box: FocalBox): FocalBox {
  const width = clamp(box.width, minFocalSize, 100);
  const height = clamp(box.height, minFocalSize, 100);
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const centerX = clamp(box.x + box.width / 2, halfWidth, 100 - halfWidth);
  const centerY = clamp(box.y + box.height / 2, halfHeight, 100 - halfHeight);
  return { width, height, x: centerX - halfWidth, y: centerY - halfHeight };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatPercent(value: number) {
  return value.toFixed(2);
}
