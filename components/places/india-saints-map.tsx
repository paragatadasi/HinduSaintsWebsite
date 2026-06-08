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

type RouteSaintLocation = {
  point: ProjectedPoint;
  saint: PublicPlaceMapSaint;
};

type RouteSegment = {
  id: string;
  from: ProjectedPoint;
  to: ProjectedPoint;
  variant: "ordered" | "associated";
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
    const filteredPoints = mapData.points
      .map((point) => {
        const activeSaints = timeFilterEnabled
          ? point.saints.filter((saint) => saintLivedDuringYear(saint, selectedYear))
          : point.saints;

        return {
          ...point,
          activeSaints
        };
      });
    const visiblePoints = timeFilterEnabled ? removeSupersededStateAssociations(filteredPoints) : filteredPoints;

    return visiblePoints
      .map((point) => {
        if (point.activeSaints.length === 0) return null;

        const projected = projectCoordinate(point.latitude, point.longitude);
        const coordinateKey = `${Math.round(projected.x)}:${Math.round(projected.y)}`;
        const coordinateIndex = groupedCoordinateCounts.get(coordinateKey) ?? 0;
        groupedCoordinateCounts.set(coordinateKey, coordinateIndex + 1);
        const offset = getMarkerOffset(coordinateIndex);

        return {
          ...point,
          x: projected.x + offset.x,
          y: projected.y + offset.y
        };
      })
      .filter((point): point is ProjectedPoint => Boolean(point));
  }, [mapData.points, selectedYear, timeFilterEnabled]);

  const saintRoutes = useMemo(() => buildSaintRoutes(projectedPoints), [projectedPoints]);
  const selectedPoint = projectedPoints.find((point) => point.slug === selectedSlug);
  const hoveredPoint = timeFilterEnabled ? undefined : projectedPoints.find((point) => point.slug === hoveredSlug);
  const visibleSaintCount = new Set(projectedPoints.flatMap((point) => point.activeSaints.map((saint) => saint.slug))).size;
  const enableTimeFilter = () => {
    setHoveredSlug("");
    setTimeFilterEnabled(true);
  };
  const updateSelectedYear = (value: string) => {
    enableTimeFilter();
    setSelectedYear(Number(value));
  };
  const updateHoveredSlug = (slug: string) => {
    if (!timeFilterEnabled) {
      setHoveredSlug(slug);
    }
  };

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
            {timeFilterEnabled ? saintRoutes.segments.map((segment) => (
              <path
                className={segment.variant === "ordered" ? "places-map__route" : "places-map__route places-map__route--associated"}
                d={buildRoutePath(segment.from, segment.to)}
                key={segment.id}
              />
            )) : null}
            {projectedPoints.map((point) => (
              <g
                aria-label={`${point.name}, ${point.activeSaints.length} ${point.activeSaints.length === 1 ? "saint" : "saints"}`}
                className={point.placeScope === "state" ? "places-map__marker places-map__marker--state" : "places-map__marker"}
                key={point.slug}
                onClick={() => setSelectedSlug(point.slug)}
                onBlur={() => setHoveredSlug("")}
                onFocus={() => updateHoveredSlug(point.slug)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedSlug(point.slug);
                  }
                }}
                onMouseEnter={() => updateHoveredSlug(point.slug)}
                onMouseLeave={() => setHoveredSlug("")}
                role="button"
                tabIndex={0}
              >
                <circle className={point.slug === selectedPoint?.slug ? "places-map__marker-ring places-map__marker-ring--selected" : "places-map__marker-ring"} cx={point.x} cy={point.y} r={getMarkerRadius(point.activeSaints.length)} />
                <circle className="places-map__marker-core" cx={point.x} cy={point.y} r="4" />
              </g>
            ))}
            {timeFilterEnabled ? projectedPoints.map((point) => {
              const saints = saintRoutes.cardSaintsByPoint.get(point.slug);
              if (!saints || saints.length === 0) return null;

              return (
                <foreignObject
                  aria-hidden="true"
                  className="places-map__saint-card-object"
                  height="82"
                  key={`${point.slug}-saints`}
                  width="148"
                  x={Math.max(4, Math.min(point.x - 74, MAP_WIDTH - 152))}
                  y={Math.max(4, point.y - 98)}
                >
                  <div className="places-map__saint-card">
                    <div className="places-map__saint-card-images">
                      {saints.slice(0, 3).map((saint) => (
                        <img
                          alt=""
                          height={40}
                          key={saint.slug}
                          src={saint.image?.url ?? "/images/devotional-archive-placeholder.svg"}
                          width={40}
                        />
                      ))}
                    </div>
                    <span>{formatSaintCardLabel(saints)}</span>
                  </div>
                </foreignObject>
              );
            }) : null}
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
              onChange={(event) => {
                setHoveredSlug("");
                setTimeFilterEnabled(event.target.checked);
              }}
              type="checkbox"
            />
          </label>
          <input
            aria-label="Filter map by year"
            aria-disabled={!timeFilterEnabled}
            className={timeFilterEnabled ? undefined : "places-timeline__range--inactive"}
            max={yearRange.max}
            min={yearRange.min}
            onChange={(event) => updateSelectedYear(event.target.value)}
            onFocus={enableTimeFilter}
            onPointerDown={enableTimeFilter}
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

function buildSaintRoutes(points: ProjectedPoint[]) {
  const locationsBySaint = new Map<string, RouteSaintLocation[]>();

  for (const point of points) {
    for (const saint of point.activeSaints) {
      const locations = locationsBySaint.get(saint.slug) ?? [];
      locations.push({ point, saint });
      locationsBySaint.set(saint.slug, locations);
    }
  }

  const cardSaintsByPoint = new Map<string, PublicPlaceMapSaint[]>();
  const segments: RouteSegment[] = [];

  for (const [saintSlug, locations] of locationsBySaint) {
    const startLocation = getRouteStartLocation(locations);
    const cardSaints = cardSaintsByPoint.get(startLocation.point.slug) ?? [];
    cardSaints.push(startLocation.saint);
    cardSaintsByPoint.set(startLocation.point.slug, cardSaints);

    if (locations.length < 2) continue;

    const orderedLocations = getOrderedRouteLocations(locations);
    if (orderedLocations.length > 1) {
      for (let index = 0; index < orderedLocations.length - 1; index += 1) {
        segments.push({
          id: `${saintSlug}-route-${orderedLocations[index].point.slug}-${orderedLocations[index + 1].point.slug}`,
          from: orderedLocations[index].point,
          to: orderedLocations[index + 1].point,
          variant: "ordered"
        });
      }
    }

    for (const location of locations) {
      if (location.point.slug === startLocation.point.slug || orderedLocations.some((ordered) => ordered.point.slug === location.point.slug)) {
        continue;
      }

      segments.push({
        id: `${saintSlug}-associated-${startLocation.point.slug}-${location.point.slug}`,
        from: startLocation.point,
        to: location.point,
        variant: "associated"
      });
    }
  }

  for (const saints of cardSaintsByPoint.values()) {
    saints.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  return { cardSaintsByPoint, segments };
}

function removeSupersededStateAssociations(points: Array<PublicPlaceMapPoint & { activeSaints: PublicPlaceMapSaint[] }>) {
  const visibleStateSlugsBySaint = new Map<string, Set<string>>();

  for (const point of points) {
    if (point.placeScope === "state" || !point.stateSlug) continue;

    for (const saint of point.activeSaints) {
      const stateSlugs = visibleStateSlugsBySaint.get(saint.slug) ?? new Set<string>();
      stateSlugs.add(point.stateSlug);
      visibleStateSlugsBySaint.set(saint.slug, stateSlugs);
    }
  }

  return points
    .map((point) => {
      if (point.placeScope !== "state" || !point.stateSlug) return point;
      const stateSlug = point.stateSlug;

      return {
        ...point,
        activeSaints: point.activeSaints.filter((saint) => !visibleStateSlugsBySaint.get(saint.slug)?.has(stateSlug))
      };
    })
    .filter((point) => point.activeSaints.length > 0);
}

function getRouteStartLocation(locations: RouteSaintLocation[]) {
  return [...locations].sort(compareRouteStartLocations)[0];
}

function getOrderedRouteLocations(locations: RouteSaintLocation[]) {
  const birthLocations = locations.filter((location) => location.saint.placeType === "birth").sort(compareRouteStartLocations);
  const orderedMiddleLocations = locations
    .filter((location) => location.saint.placeType !== "birth" && location.saint.placeType !== "samadhi" && location.saint.routeOrder != null)
    .sort(compareRouteOrderLocations);
  const samadhiLocations = locations.filter((location) => location.saint.placeType === "samadhi").sort(compareRouteStartLocations);
  const routeLocations = [...birthLocations, ...orderedMiddleLocations, ...samadhiLocations];
  const seenPointSlugs = new Set<string>();

  return routeLocations.filter((location) => {
    if (seenPointSlugs.has(location.point.slug)) return false;
    seenPointSlugs.add(location.point.slug);
    return true;
  });
}

function compareRouteStartLocations(first: RouteSaintLocation, second: RouteSaintLocation) {
  return getRouteStartRank(first.saint) - getRouteStartRank(second.saint)
    || compareRouteOrderLocations(first, second);
}

function compareRouteOrderLocations(first: RouteSaintLocation, second: RouteSaintLocation) {
  return (first.saint.routeOrder ?? Number.MAX_SAFE_INTEGER) - (second.saint.routeOrder ?? Number.MAX_SAFE_INTEGER)
    || first.point.name.localeCompare(second.point.name);
}

function getRouteStartRank(saint: PublicPlaceMapSaint) {
  if (saint.placeType === "birth") return 0;
  if (saint.routeOrder != null) return 1;
  if (saint.placeType === "primary") return 2;
  if (saint.placeType === "samadhi") return 3;
  if (saint.placeType === "sadhana") return 4;
  if (saint.placeType === "associated") return 5;
  return 6;
}

function buildRoutePath(from: ProjectedPoint, to: ProjectedPoint) {
  const midpointX = (from.x + to.x) / 2;
  const midpointY = (from.y + to.y) / 2 - Math.min(48, Math.hypot(to.x - from.x, to.y - from.y) / 5);
  return `M ${from.x} ${from.y} Q ${midpointX} ${midpointY} ${to.x} ${to.y}`;
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

function formatSaintCardLabel(saints: PublicPlaceMapSaint[]) {
  const [firstSaint] = saints;
  if (!firstSaint) return "";
  return saints.length === 1 ? firstSaint.displayName : `${firstSaint.displayName} +${saints.length - 1}`;
}
