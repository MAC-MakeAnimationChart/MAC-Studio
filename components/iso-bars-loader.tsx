"use client";

import { useEffect, useRef } from "react";

// Brand colors of the logo mark.
const TOP = "#32C5FF";
const RIGHT = "#2E6DF6";
const LEFT = "#0F2167";

// Isometric geometry: one bar is a diamond of half-width DX and half-height DY, drawn from three faces.
const DX = 34.641;
const DY = 20;
const GAP = 1.25; // distance between bars, in bar widths, along the isometric axis
const BASE_X = 52;
const BASE_Y = 205;
const HEIGHTS = [56, 84, 112]; // 1 : 1.5 : 2

// Timeline (ms): bars rise one after another, hold, sink one after another, rest, repeat.
const STAGGER = 150;
const RISE = 800;
const HOLD = 1000;
const SINK = 350;
const SINK_STAGGER = 80;
const REST = 250;
const SINK_START = 2 * STAGGER + RISE + HOLD;
const CYCLE = SINK_START + 2 * SINK_STAGGER + SINK + REST;

const easeOutElastic = (t: number) =>
  t <= 0
    ? 0
    : t >= 1
      ? 1
      : 2 ** (-10 * t) * Math.sin(((t * 10 - 0.75) * (2 * Math.PI)) / 3) + 1;
const easeInCubic = (t: number) => t * t * t;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

const center = (i: number) => ({
  x: BASE_X + i * GAP * DX,
  y: BASE_Y - i * GAP * DY,
});

function faces(i: number, progress: number) {
  const { x, y } = center(i);
  const h = HEIGHTS[i] * Math.max(progress, 0);
  return {
    top: `${x},${y - DY - h} ${x + DX},${y - h} ${x},${y + DY - h} ${x - DX},${y - h}`,
    left: `${x - DX},${y} ${x},${y + DY} ${x},${y + DY - h} ${x - DX},${y - h}`,
    right: `${x},${y + DY} ${x + DX},${y} ${x + DX},${y - h} ${x},${y + DY - h}`,
  };
}

function progressAt(i: number, t: number) {
  const sinkAt = SINK_START + (2 - i) * SINK_STAGGER;
  if (t >= sinkAt) return 1 - easeInCubic(clamp01((t - sinkAt) / SINK));
  // 60% of a full elastic overshoot: lively without looking rubbery
  return 1 + (easeOutElastic(clamp01((t - i * STAGGER) / RISE)) - 1) * 0.6;
}

type Props = { size?: number; className?: string };

// The logo's three isometric bars rising in turn, on a loop. Pure SVG, no dependencies.
// The ground shadow reads --loader-shadow so it can differ in light and dark mode.
export function IsoBarsLoader({ size = 120, className }: Props) {
  const tops = useRef<(SVGPolygonElement | null)[]>([]);
  const lefts = useRef<(SVGPolygonElement | null)[]>([]);
  const rights = useRef<(SVGPolygonElement | null)[]>([]);
  const shadow = useRef<SVGEllipseElement | null>(null);

  useEffect(() => {
    const paint = (t: number) => {
      let total = 0;
      for (let i = 0; i < HEIGHTS.length; i++) {
        const p = progressAt(i, t);
        total += clamp01(p);
        const f = faces(i, p);
        tops.current[i]?.setAttribute("points", f.top);
        lefts.current[i]?.setAttribute("points", f.left);
        rights.current[i]?.setAttribute("points", f.right);
      }
      shadow.current?.setAttribute(
        "opacity",
        String(0.35 + 0.65 * (total / HEIGHTS.length)),
      );
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      paint(SINK_START - 1); // everything up, nothing moving
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      paint((now - start) % CYCLE);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Back to front, so the taller bars sit behind the shorter ones.
  const order = [2, 1, 0];

  return (
    <svg
      viewBox="0 0 180 250"
      width={size}
      height={(size * 250) / 180}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter
          id="iso-loader-blur"
          x="-30%"
          y="-100%"
          width="160%"
          height="300%"
        >
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <ellipse
        ref={shadow}
        cx={BASE_X + GAP * DX}
        cy={BASE_Y + DY + 14}
        rx="84"
        ry="11"
        fill="var(--loader-shadow)"
        filter="url(#iso-loader-blur)"
      />
      {order.map((i) => {
        const f = faces(i, 1);
        return (
          <g key={i}>
            <polygon
              ref={(el) => {
                lefts.current[i] = el;
              }}
              points={f.left}
              fill={LEFT}
            />
            <polygon
              ref={(el) => {
                rights.current[i] = el;
              }}
              points={f.right}
              fill={RIGHT}
            />
            <polygon
              ref={(el) => {
                tops.current[i] = el;
              }}
              points={f.top}
              fill={TOP}
            />
          </g>
        );
      })}
    </svg>
  );
}
