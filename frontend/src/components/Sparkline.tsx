"use client";

import { useId } from "react";
import type { PricePoint } from "@/lib/types";

interface SparklineProps {
  points: PricePoint[];
  width?: number;
  height?: number;
  className?: string;
}

export default function Sparkline({
  points,
  width = 260,
  height = 64,
  className = "",
}: SparklineProps) {
  const gradientId = useId();

  if (!points || points.length < 2) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-xs text-zinc-600">No price history</span>
      </div>
    );
  }

  // Drop non-finite prices so a bad upstream value can't NaN the geometry.
  const values = points.map((p) => p.price).filter((v) => Number.isFinite(v));
  if (values.length < 2) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-xs text-zinc-600">No price history</span>
      </div>
    );
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 4;

  const stepX = (width - pad * 2) / (values.length - 1);
  const coords = values.map((v, i) => ({
    x: pad + i * stepX,
    y: height - pad - ((v - min) / range) * (height - pad * 2),
  }));

  const line = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L${coords[coords.length - 1].x.toFixed(2)},${height} L${coords[0].x.toFixed(2)},${height} Z`;

  const rising = values[values.length - 1] >= values[0];
  const stroke = rising ? "#34d399" : "#f87171";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={coords[coords.length - 1].x}
        cy={coords[coords.length - 1].y}
        r={3}
        fill={stroke}
      />
    </svg>
  );
}
