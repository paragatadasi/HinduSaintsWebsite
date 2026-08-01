"use client";
import type { CSSProperties, PointerEvent } from "react";
import { useRef, useState } from "react";
type Props = { altText: string; defaultX: number; defaultY: number; imageUrl: string; xName: string; yName: string };
export function HeroFocalPointPicker({ altText, defaultX, defaultY, imageUrl, xName, yName }: Props) {
  const [point, setPoint] = useState({ x: clamp(defaultX), y: clamp(defaultY) });
  const stageRef = useRef<HTMLDivElement>(null);
  const style = { "--focal-x": `${point.x}%`, "--focal-y": `${point.y}%` } as CSSProperties;
  function update(event: PointerEvent<HTMLDivElement>) { const rect = stageRef.current?.getBoundingClientRect(); if (rect) setPoint({ x: clamp((event.clientX - rect.left) / rect.width * 100), y: clamp((event.clientY - rect.top) / rect.height * 100) }); }
  return <div className="hero-focal-picker"><input name={xName} type="hidden" value={point.x.toFixed(2)} /><input name={yName} type="hidden" value={point.y.toFixed(2)} /><p className="review-hint">Click or drag to position the focal point.</p><div className="hero-focal-picker__stage" ref={stageRef} style={style} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); update(event); }} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) update(event); }}><img src={imageUrl} alt={altText} draggable={false} /><span className="hero-focal-picker__marker" aria-hidden="true" /></div></div>;
}
function clamp(value: number) { return Math.min(100, Math.max(0, value)); }
