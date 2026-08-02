"use client";

import { useState, type CSSProperties } from "react";

type SaintEraRangeProps = {
  end: number;
  max: number;
  min: number;
  start: number;
};

export function SaintEraRange({ end: initialEnd, max, min, start: initialStart }: SaintEraRangeProps) {
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const span = Math.max(max - min, 1);
  const startPosition = ((start - min) / span) * 100;
  const endPosition = ((end - min) / span) * 100;
  const hasSelectedRange = start !== min || end !== max;

  return (
    <fieldset className="era-range">
      <legend>Timespan</legend>
      <div className="era-range__values" aria-live="polite">
        <span>{formatYear(start)}</span>
        <span>{formatYear(end)}</span>
      </div>
      <div
        className="era-range__track"
        style={{ "--era-range-end": `${endPosition}%`, "--era-range-start": `${startPosition}%` } as CSSProperties}
      >
        <input
          aria-label="Earliest year"
          max={max}
          min={min}
          name={hasSelectedRange ? "startYear" : undefined}
          onChange={(event) => setStart(Math.min(Number(event.target.value), end))}
          type="range"
          value={start}
        />
        <input
          aria-label="Latest year"
          max={max}
          min={min}
          name={hasSelectedRange ? "endYear" : undefined}
          onChange={(event) => setEnd(Math.max(Number(event.target.value), start))}
          type="range"
          value={end}
        />
      </div>
      <div className="era-range__bounds" aria-hidden="true">
        <span>{formatYear(min)}</span>
        <span>{formatYear(max)}</span>
      </div>
    </fieldset>
  );
}

function formatYear(year: number) {
  return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
}
