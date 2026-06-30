"use client";

import type { CSSProperties, PointerEvent } from "react";
import { useRef, useState } from "react";

type FocalArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type FocalBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

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
  imageUrl: string;
};

const minFocalSize = 10;
const focalHandles: DragMode[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

export function HomeBannerFocalPicker({ altText, defaultArea, imageUrl }: HomeBannerFocalPickerProps) {
  const [area, setArea] = useState(() => normalizeArea(defaultArea));
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
    dragStateRef.current = {
      box: initialBox,
      mode,
      pointerX: event.clientX,
      pointerY: event.clientY
    };
    stageRef.current?.setPointerCapture(event.pointerId);
  }

  function getRepositionedBox(event: PointerEvent<HTMLDivElement>) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return box;

    const nextX = ((event.clientX - rect.left) / rect.width) * 100;
    const nextY = ((event.clientY - rect.top) / rect.height) * 100;

    return clampFocalBox({
      ...box,
      x: nextX - box.width / 2,
      y: nextY - box.height / 2
    });
  }

  function handleFocalDrag(event: PointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!dragState || !rect) return;

    const deltaX = ((event.clientX - dragState.pointerX) / rect.width) * 100;
    const deltaY = ((event.clientY - dragState.pointerY) / rect.height) * 100;

    setArea(boxToArea(resizeFocalBox(dragState.box, dragState.mode, deltaX, deltaY)));
  }

  function stopFocalDrag(event: PointerEvent<HTMLDivElement>) {
    dragStateRef.current = null;
    if (stageRef.current?.hasPointerCapture(event.pointerId)) {
      stageRef.current.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div className="home-focal-picker">
      <input name="bannerFocalX" type="hidden" value={formatPercent(area.x)} />
      <input name="bannerFocalY" type="hidden" value={formatPercent(area.y)} />
      <input name="bannerFocalWidth" type="hidden" value={formatPercent(area.width)} />
      <input name="bannerFocalHeight" type="hidden" value={formatPercent(area.height)} />

      <div
        className="home-focal-picker__stage"
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
        <div
          className="home-focal-picker__selection"
          aria-hidden="true"
          onPointerDown={(event) => startFocalDrag(event, "move")}
        >
          {focalHandles.map((handle) => (
            <span
              className="home-focal-picker__handle"
              data-handle={handle}
              key={handle}
              onPointerDown={(event) => startFocalDrag(event, handle)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function normalizeArea(area: FocalArea): FocalArea {
  return boxToArea(clampFocalBox(areaToBox({
    x: clamp(area.x, 0, 100),
    y: clamp(area.y, 0, 100),
    width: area.width,
    height: area.height
  })));
}

function areaToBox(area: FocalArea): FocalBox {
  const width = clamp(area.width, minFocalSize, 100);
  const height = clamp(area.height, minFocalSize, 100);

  return {
    x: area.x - width / 2,
    y: area.y - height / 2,
    width,
    height
  };
}

function boxToArea(box: FocalBox): FocalArea {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
    width: box.width,
    height: box.height
  };
}

function resizeFocalBox(initial: FocalBox, mode: DragMode, deltaX: number, deltaY: number): FocalBox {
  let { x, y, width, height } = initial;

  if (mode === "move") {
    return clampFocalBox({
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

  return clampFocalBox({ x, y, width, height });
}

function clampFocalBox(box: FocalBox): FocalBox {
  const width = clamp(box.width, minFocalSize, 100);
  const height = clamp(box.height, minFocalSize, 100);
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const centerX = clamp(box.x + box.width / 2, halfWidth, 100 - halfWidth);
  const centerY = clamp(box.y + box.height / 2, halfHeight, 100 - halfHeight);

  return {
    width,
    height,
    x: centerX - halfWidth,
    y: centerY - halfHeight
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatPercent(value: number) {
  return value.toFixed(2);
}
