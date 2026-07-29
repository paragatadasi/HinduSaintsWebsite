import { StatusBadge } from "@/components/ui/status-badge";

export type AggregateViewPoint = {
  date: Date;
  views: number;
};

type AggregateViewsChartProps = {
  points: AggregateViewPoint[];
};

const CHART_WIDTH = 960;
const CHART_HEIGHT = 260;
const PLOT_TOP = 16;
const PLOT_RIGHT = 16;
const PLOT_BOTTOM = 38;
const PLOT_LEFT = 48;

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "UTC"
});

export function AggregateViewsChart({ points }: AggregateViewsChartProps) {
  const totalViews = points.reduce((total, point) => total + point.views, 0);
  const maximumViews = Math.max(...points.map((point) => point.views), 0);
  const axisMaximum = getAxisMaximum(maximumViews);
  const plotWidth = CHART_WIDTH - PLOT_LEFT - PLOT_RIGHT;
  const plotHeight = CHART_HEIGHT - PLOT_TOP - PLOT_BOTTOM;
  const slotWidth = plotWidth / Math.max(points.length, 1);
  const barWidth = slotWidth * 0.72;
  const yTicks = getYAxisTicks(axisMaximum);
  const xLabelIndexes = getXAxisLabelIndexes(points.length);

  return (
    <section className="review-panel" aria-labelledby="aggregate-view-chart-heading">
      <div className="admin-toolbar">
        <div>
          <div className="eyebrow">Aggregate trend</div>
          <h2 id="aggregate-view-chart-heading">Views over the last 30 days</h2>
          <p>Daily public page requests, combined across every tracked page.</p>
        </div>
        <StatusBadge label={`${formatNumber(totalViews)} views`} />
      </div>

      {totalViews > 0 ? (
        <>
          <svg
            aria-describedby="aggregate-view-chart-description"
            aria-labelledby="aggregate-view-chart-title"
            className="analytics-chart__svg"
            preserveAspectRatio="none"
            role="img"
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          >
            <title id="aggregate-view-chart-title">Aggregate page views by day for the last 30 days</title>
            <desc id="aggregate-view-chart-description">
              {`${formatNumber(totalViews)} total views. The busiest day had ${formatNumber(maximumViews)} views.`}
            </desc>

            {yTicks.map((tick) => {
              const y = PLOT_TOP + plotHeight - (tick / axisMaximum) * plotHeight;

              return (
                <g key={tick}>
                  <line
                    className="analytics-chart__grid-line"
                    x1={PLOT_LEFT}
                    x2={CHART_WIDTH - PLOT_RIGHT}
                    y1={y}
                    y2={y}
                  />
                  <text
                    className="analytics-chart__axis-label"
                    dominantBaseline="middle"
                    textAnchor="end"
                    x={PLOT_LEFT - 10}
                    y={y}
                  >
                    {formatNumber(tick)}
                  </text>
                </g>
              );
            })}

            {points.map((point, index) => {
              const barHeight = (point.views / axisMaximum) * plotHeight;
              const x = PLOT_LEFT + index * slotWidth + (slotWidth - barWidth) / 2;
              const y = PLOT_TOP + plotHeight - barHeight;

              return (
                <rect
                  className="analytics-chart__bar"
                  height={barHeight}
                  key={point.date.toISOString()}
                  width={barWidth}
                  x={x}
                  y={y}
                >
                  <title>{`${dateFormatter.format(point.date)}: ${formatNumber(point.views)} views`}</title>
                </rect>
              );
            })}

            {xLabelIndexes.map((index) => {
              const point = points[index];
              const x = PLOT_LEFT + index * slotWidth + slotWidth / 2;

              return (
                <text
                  className="analytics-chart__axis-label"
                  key={point.date.toISOString()}
                  textAnchor="middle"
                  x={x}
                  y={CHART_HEIGHT - 10}
                >
                  {dateFormatter.format(point.date)}
                </text>
              );
            })}
          </svg>

          <ol className="sr-only">
            {points.map((point) => (
              <li key={point.date.toISOString()}>
                {dateFormatter.format(point.date)}: {formatNumber(point.views)} views
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="empty-note">The daily chart will appear after public pages receive requests.</p>
      )}
    </section>
  );
}

function getAxisMaximum(maximumViews: number) {
  if (maximumViews <= 1) return 1;

  const magnitude = 10 ** Math.floor(Math.log10(maximumViews));
  const normalized = maximumViews / magnitude;
  const rounded = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return rounded * magnitude;
}

function getYAxisTicks(axisMaximum: number) {
  const values = [axisMaximum, Math.round(axisMaximum / 2), 0];
  return [...new Set(values)];
}

function getXAxisLabelIndexes(pointCount: number) {
  if (pointCount === 0) return [];

  return [...new Set([0, 7, 14, 21, pointCount - 1])].filter((index) => index < pointCount);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}
