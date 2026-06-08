"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import type { PublicPlaceMapData, PublicPlaceMapPoint, PublicPlaceMapSaint } from "@/lib/public-contracts";
import type { PlacesMapContent } from "@/lib/site-content";

type IndiaSaintsMapProps = {
  content: PlacesMapContent;
  mapData: PublicPlaceMapData;
};

type ProjectedPoint = PublicPlaceMapPoint & {
  activeSaints: PublicPlaceMapSaint[];
  x: number;
  y: number;
};

const MAP_WIDTH = 720;
const MAP_HEIGHT = 640;
const MAP_PADDING = 40;
const INDIA_BOUNDS = {
  minLatitude: 6,
  maxLatitude: 37.6,
  minLongitude: 67.5,
  maxLongitude: 98
};

const INDIA_OUTLINE: Array<[number, number]> = [
  [68.1, 23.6],
  [69.3, 24.4],
  [70.9, 24.9],
  [72.2, 26.6],
  [73.8, 30.3],
  [74.7, 32.6],
  [76.2, 34.6],
  [78.3, 35.8],
  [80.4, 34.9],
  [82.7, 32.7],
  [84.4, 28.6],
  [88.2, 27.8],
  [91.8, 26.8],
  [95.0, 28.0],
  [97.0, 27.0],
  [95.2, 24.2],
  [92.8, 23.6],
  [91.2, 22.2],
  [88.4, 21.7],
  [87.1, 20.2],
  [86.0, 19.0],
  [84.8, 18.7],
  [83.0, 17.9],
  [81.7, 16.4],
  [80.6, 13.6],
  [80.2, 11.2],
  [78.4, 8.3],
  [77.3, 7.7],
  [76.1, 8.9],
  [74.9, 12.1],
  [73.7, 15.1],
  [72.8, 18.6],
  [71.0, 20.7],
  [68.1, 23.6]
];

export function IndiaSaintsMap({ content, mapData }: IndiaSaintsMapProps) {
  const yearRange = mapData.yearRange;
  const [timeFilterEnabled, setTimeFilterEnabled] = useState(false);
  const [selectedYear, setSelectedYear] = useState(yearRange ? Math.round((yearRange.min + yearRange.max) / 2) : 0);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [hoveredSlug, setHoveredSlug] = useState("");

  const projectedPoints = useMemo(() => {
    const groupedCoordinateCounts = new Map<string, number>();

    return mapData.points
      .map((point) => {
        const activeSaints = timeFilterEnabled
          ? point.saints.filter((saint) => saintLivedDuringYear(saint, selectedYear))
          : point.saints;

        if (activeSaints.length === 0) return null;

        const projected = projectCoordinate(point.latitude, point.longitude);
        const coordinateKey = `${Math.round(projected.x)}:${Math.round(projected.y)}`;
        const coordinateIndex = groupedCoordinateCounts.get(coordinateKey) ?? 0;
        groupedCoordinateCounts.set(coordinateKey, coordinateIndex + 1);
        const offset = getMarkerOffset(coordinateIndex);

        return {
          ...point,
          activeSaints,
          x: projected.x + offset.x,
          y: projected.y + offset.y
        };
      })
      .filter((point): point is ProjectedPoint => Boolean(point));
  }, [mapData.points, selectedYear, timeFilterEnabled]);

  const selectedPoint = projectedPoints.find((point) => point.slug === selectedSlug);
  const hoveredPoint = projectedPoints.find((point) => point.slug === hoveredSlug);
  const visibleSaintCount = new Set(projectedPoints.flatMap((point) => point.activeSaints.map((saint) => saint.slug))).size;

  return (
    <section className="places-map-section" aria-labelledby="places-map-title">
      <div className="section-heading section-heading--text">
        <div>
          <div className="eyebrow">{content.eyebrow}</div>
          <h2 id="places-map-title">{content.title}</h2>
          <p>{content.description}</p>
        </div>
        <p>{visibleSaintCount} {visibleSaintCount === 1 ? "saint" : "saints"} across {projectedPoints.length} mapped places</p>
      </div>
      <div className="places-map">
        <div className="places-map__canvas">
          <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="img" aria-label="Interactive map of Indian places associated with published saints">
            <polygon className="places-map__land" points={INDIA_OUTLINE.map(([longitude, latitude]) => {
              const point = projectCoordinate(latitude, longitude);
              return `${point.x},${point.y}`;
            }).join(" ")} />
            <path className="places-map__coastline" d={buildOutlinePath()} />
            {projectedPoints.map((point) => (
              <g
                aria-label={`${point.name}, ${point.activeSaints.length} ${point.activeSaints.length === 1 ? "saint" : "saints"}`}
                className="places-map__marker"
                key={point.slug}
                onClick={() => setSelectedSlug(point.slug)}
                onBlur={() => setHoveredSlug("")}
                onFocus={() => setHoveredSlug(point.slug)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedSlug(point.slug);
                  }
                }}
                onMouseEnter={() => setHoveredSlug(point.slug)}
                onMouseLeave={() => setHoveredSlug("")}
                role="button"
                tabIndex={0}
              >
                <circle className={point.slug === selectedPoint?.slug ? "places-map__marker-ring places-map__marker-ring--selected" : "places-map__marker-ring"} cx={point.x} cy={point.y} r={getMarkerRadius(point.activeSaints.length)} />
                <circle className="places-map__marker-core" cx={point.x} cy={point.y} r="4" />
              </g>
            ))}
            {hoveredPoint ? (
              <g className="places-map__hover-card" transform={`translate(${Math.min(hoveredPoint.x + 18, MAP_WIDTH - 182)} ${Math.max(hoveredPoint.y - 52, 16)})`}>
                <rect height="48" rx="8" width="164" />
                <text className="places-map__hover-card-title" x="12" y="20">{formatHoverPlaceName(hoveredPoint.name)}</text>
                <text className="places-map__hover-card-meta" x="12" y="37">{hoveredPoint.activeSaints.length} {hoveredPoint.activeSaints.length === 1 ? "saint" : "saints"}</text>
              </g>
            ) : null}
          </svg>
        </div>
        <aside className="places-map__panel" aria-live="polite">
          {selectedPoint ? (
            <>
              <div>
                <div className="eyebrow">{selectedPoint.activeSaints.length} {selectedPoint.activeSaints.length === 1 ? "saint" : "saints"}</div>
                <h3>{selectedPoint.name}</h3>
                {selectedPoint.region || selectedPoint.country ? <p>{[selectedPoint.region, selectedPoint.country].filter(Boolean).join(", ")}</p> : null}
              </div>
              <ul className="places-map__saint-list">
                {selectedPoint.activeSaints.slice(0, 8).map((saint) => (
                  <li key={saint.slug}>
                    <Link href={`/saints/${saint.slug}`}>{saint.displayName}</Link>
                    <span>{saint.eraLabel} - {saint.tradition}</span>
                  </li>
                ))}
              </ul>
              {selectedPoint.activeSaints.length > 8 ? <p className="empty-note">+{selectedPoint.activeSaints.length - 8} more associated saints</p> : null}
              <Link className="button button--secondary" href={`/places/${selectedPoint.slug}`}>Open place</Link>
            </>
          ) : (
            <div className="places-map__prompt">
              <div className="eyebrow">Explore</div>
              <h3>{content.promptTitle}</h3>
              <p>{projectedPoints.length > 0 ? content.promptBody : "No mapped places match the selected year."}</p>
            </div>
          )}
        </aside>
      </div>
      {yearRange ? (
        <div className="places-timeline">
          <label>
            <span>Time filter</span>
            <input
              checked={timeFilterEnabled}
              onChange={(event) => setTimeFilterEnabled(event.target.checked)}
              type="checkbox"
            />
          </label>
          <input
            aria-label="Filter map by year"
            disabled={!timeFilterEnabled}
            max={yearRange.max}
            min={yearRange.min}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
            step="1"
            type="range"
            value={selectedYear}
          />
          <strong>{timeFilterEnabled ? selectedYear : "All eras"}</strong>
          <button aria-label="Reset time filter" onClick={() => setTimeFilterEnabled(false)} type="button">
            <RotateCcw size={18} />
          </button>
        </div>
      ) : null}
    </section>
  );
}

function projectCoordinate(latitude: number, longitude: number) {
  const drawableWidth = MAP_WIDTH - MAP_PADDING * 2;
  const drawableHeight = MAP_HEIGHT - MAP_PADDING * 2;

  return {
    x: MAP_PADDING + ((longitude - INDIA_BOUNDS.minLongitude) / (INDIA_BOUNDS.maxLongitude - INDIA_BOUNDS.minLongitude)) * drawableWidth,
    y: MAP_PADDING + ((INDIA_BOUNDS.maxLatitude - latitude) / (INDIA_BOUNDS.maxLatitude - INDIA_BOUNDS.minLatitude)) * drawableHeight
  };
}

function buildOutlinePath() {
  return INDIA_OUTLINE.map(([longitude, latitude], index) => {
    const point = projectCoordinate(latitude, longitude);
    return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
  }).join(" ") + " Z";
}

function saintLivedDuringYear(saint: PublicPlaceMapSaint, year: number) {
  if (saint.birthYear == null && saint.samadhiYear == null) return false;

  const birthYear = saint.birthYear ?? saint.samadhiYear;
  const samadhiYear = saint.samadhiYear ?? saint.birthYear;
  return birthYear != null && samadhiYear != null && birthYear <= year && samadhiYear >= year;
}

function getMarkerRadius(saintCount: number) {
  return Math.min(16, 5 + Math.sqrt(saintCount) * 2.4);
}

function getMarkerOffset(index: number) {
  if (index === 0) return { x: 0, y: 0 };

  const angle = index * 1.9;
  const distance = 8 + Math.floor(index / 6) * 5;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance
  };
}

function formatHoverPlaceName(name: string) {
  return name.length > 22 ? `${name.slice(0, 19)}...` : name;
}
