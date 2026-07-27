"use client";

import * as React from "react";

export function SignalPlot({
  values,
  progress,
  label,
  unit,
}: {
  values: number[];
  progress: number;
  label: string;
  unit: string;
}) {
  const width = 680;
  const height = 150;
  const pad = 18;
  const { points, minimum, maximum } = React.useMemo(() => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(max - min, 1e-9);
    const next = values
      .map((value, index) => {
        const x =
          pad +
          (index / Math.max(values.length - 1, 1)) * (width - 2 * pad);
        const y = height - pad - ((value - min) / span) * (height - 2 * pad);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
    return { points: next, minimum: min, maximum: max };
  }, [values]);
  const markerX = pad + progress * (width - 2 * pad);
  const markerIndex = Math.min(
    Math.round(progress * Math.max(values.length - 1, 0)),
    values.length - 1,
  );
  const current = values[markerIndex] ?? 0;

  return (
    <div className="border border-border bg-background p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="label">{label}</span>
        <span className="data text-xs text-ash">
          {current.toFixed(3)} {unit}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-36 w-full"
        role="img"
        aria-label={`${label} from ${minimum.toFixed(3)} to ${maximum.toFixed(3)} ${unit}`}
      >
        <line
          x1={pad}
          y1={height / 2}
          x2={width - pad}
          y2={height / 2}
          stroke="var(--border)"
        />
        <polyline
          fill="none"
          stroke="var(--ash)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          points={points}
        />
        <line
          x1={markerX}
          y1={pad}
          x2={markerX}
          y2={height - pad}
          stroke="var(--foreground)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
