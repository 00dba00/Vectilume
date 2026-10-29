"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import styles from "./admin.module.css";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Counts up from 0 once on load; the server-rendered value is the final one, so it reads right without JS. */
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || value === 0 || reducedMotion()) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      el.textContent = String(Math.round(value * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    el.textContent = "0";
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      el.textContent = String(value);
    };
  }, [value]);
  return <span ref={ref}>{value}</span>;
}

export interface DayPoint {
  day: string;
  requests: number;
  tokens: number;
}

const SERIES = [
  { key: "requests", label: "Requests", color: "var(--series-1)" },
  { key: "tokens", label: "New tokens", color: "var(--series-2)" },
] as const;

const HEIGHT = 320;
const PAD = { top: 16, right: 16, bottom: 28, left: 32 };
const dayLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const fmtDay = (day: string) => dayLabel.format(new Date(`${day}T00:00:00Z`));

function niceStep(max: number) {
  const raw = Math.max(1, max) / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw)!;
  return Math.max(1, step);
}

/** Monotone cubic path (Fritsch–Carlson): smooth, and never dips below a zero count between points. */
function smoothPath(points: [number, number][]) {
  const n = points.length;
  if (n < 2) return points.length ? `M${points[0][0]},${points[0][1]}` : "";
  const dx = points.slice(1).map((p, i) => p[0] - points[i][0]);
  const slope = points.slice(1).map((p, i) => (p[1] - points[i][1]) / dx[i]);
  const tangent = points.map((_, i) => {
    if (i === 0) return slope[0];
    if (i === n - 1) return slope[n - 2];
    return slope[i - 1] * slope[i] <= 0 ? 0 : (2 * slope[i - 1] * slope[i]) / (slope[i - 1] + slope[i]);
  });
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const h = dx[i] / 3;
    d += ` C${x0 + h},${y0 + h * tangent[i]} ${x1 - h},${y1 - h * tangent[i + 1]} ${x1},${y1}`;
  }
  return d;
}

export function ActivityChart({ data }: { data: DayPoint[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const max = Math.max(...data.flatMap((d) => [d.requests, d.tokens]));
  const step = niceStep(max);
  const top = Math.max(step, Math.ceil(max / step) * step);
  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2);
  const y = (v: number) => PAD.top + innerH - (v / top) * innerH;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const labelEvery = width < 480 ? 10 : 7;

  const pick = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const i = Math.round(((event.clientX - box.left - PAD.left) / innerW) * (data.length - 1));
    setActive(Math.min(data.length - 1, Math.max(0, i)));
  };
  const keys = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = event.key === "ArrowLeft" ? -1 : 1;
    setActive((i) => Math.min(data.length - 1, Math.max(0, (i ?? data.length - 1) + delta)));
  };

  const point = active === null ? null : data[active];
  const tipLeft = active === null ? 0 : Math.min(Math.max(x(active), 80), width - 80);

  return (
    <div ref={wrap} className={styles.chart}>
      <ul className={styles.legend}>
        {SERIES.map((s) => (
          <li key={s.key}>
            <span style={{ background: s.color }} />
            {s.label}
          </li>
        ))}
      </ul>
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label="Requests and new tokens per day, last 30 days. Use the arrow keys to read single days."
        tabIndex={0}
        onPointerMove={pick}
        onPointerLeave={() => setActive(null)}
        onKeyDown={keys}
        onBlur={() => setActive(null)}
      >
        <defs>
          {SERIES.map((s) => (
            <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.42" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className={styles.grid} />
            <text x={PAD.left - 8} y={y(t)} className={styles.axis} textAnchor="end" dominantBaseline="middle">
              {t}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          (data.length - 1 - i) % labelEvery === 0 ? (
            <text key={d.day} x={x(i)} y={HEIGHT - 8} className={styles.axis} textAnchor="middle">
              {fmtDay(d.day)}
            </text>
          ) : null,
        )}
        <g className={styles.reveal}>
          {SERIES.map((s) => {
            const pts = data.map((d, i): [number, number] => [x(i), y(d[s.key])]);
            const line = smoothPath(pts);
            const area = `${line} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
            return (
              <g key={s.key}>
                <path d={area} fill={`url(#fill-${s.key})`} />
                <path d={line} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            );
          })}
        </g>
        {point && active !== null && (
          <g>
            <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + innerH} className={styles.crosshair} />
            {SERIES.map((s) => (
              <circle key={s.key} cx={x(active)} cy={y(point[s.key])} r={5} fill={s.color} className={styles.dot} />
            ))}
          </g>
        )}
      </svg>
      {point && (
        <div className={styles.tooltip} style={{ left: tipLeft }} aria-live="polite">
          <strong>{fmtDay(point.day)}</strong>
          {SERIES.map((s) => (
            <span key={s.key}>
              <i style={{ background: s.color }} />
              {s.label} <b>{point[s.key]}</b>
            </span>
          ))}
        </div>
      )}
      <table className={styles.srOnly}>
        <caption>Requests and new tokens per day</caption>
        <thead>
          <tr><th>Day</th><th>Requests</th><th>New tokens</th></tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}><td>{fmtDay(d.day)}</td><td>{d.requests}</td><td>{d.tokens}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
