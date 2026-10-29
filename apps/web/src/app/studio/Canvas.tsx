"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { anchors, type Pt, type Seg } from "@/lib/studio/path";
import { handles, moveHandle, newId, ROOT, shapeMarkup, toPathData, translate, type IconStyle, type Shape } from "@/lib/studio/model";
import styles from "./studio.module.css";

export type Tool = "select" | "pen" | "line" | "rect" | "circle" | "ellipse";
export interface View {
  x: number;
  y: number;
  size: number;
}
export interface PointRef {
  id: string;
  key: string;
}

interface CanvasProps {
  shapes: Shape[];
  style: IconStyle;
  tool: Tool;
  snap: boolean;
  view: View;
  selected: string[];
  point: PointRef | null;
  onView: (view: View) => void;
  onSelect: (ids: string[], point?: PointRef | null) => void;
  /** Starts an undo step; the updates that follow belong to it. */
  begin: () => void;
  update: (fn: (shapes: Shape[]) => Shape[]) => void;
  /** Bumped by the parent to end the pen path (Enter, Escape, tool change). */
  penStop: number;
}

type Drag =
  | { mode: "move"; start: Pt; originals: Map<string, Shape> }
  | { mode: "handle"; id: string; key: string }
  | { mode: "create"; id: string; start: Pt; kind: Tool }
  | { mode: "pen"; down: Pt }
  | { mode: "pan"; client: Pt; view: View };

const isFilled = (s: Shape, style: IconStyle) =>
  style === "solid" ? s.attrs.fill !== "none" : Boolean(s.attrs.fill && s.attrs.fill !== "none");

export function Canvas(props: CanvasProps) {
  const { shapes, style, tool, snap, view, selected, point, onView, onSelect, begin, update, penStop } = props;
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const pen = useRef<{ id: string; out: Pt | null; seg: number } | null>(null);
  const [space, setSpace] = useState(false);
  const [px, setPx] = useState(560);
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  });

  const unit = view.size / px;
  const snapV = (v: number) => (snap ? Math.round(v * 4) / 4 : Math.round(v * 100) / 100);
  const snapPt = (p: Pt): Pt => ({ x: snapV(p.x), y: snapV(p.y) });

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    // The square viewBox is letterboxed into the element, so the shorter side sets the scale.
    const resize = new ResizeObserver(([entry]) => setPx(Math.min(entry.contentRect.width, entry.contentRect.height) || 560));
    resize.observe(el);
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const { view: v, onView: set } = latest.current;
      const p = toSvg(e.clientX, e.clientY);
      const size = Math.min(48, Math.max(3, v.size * Math.exp(e.deltaY * 0.0015)));
      set({ size, x: p.x - ((p.x - v.x) * size) / v.size, y: p.y - ((p.y - v.y) * size) / v.size });
    };
    el.addEventListener("wheel", wheel, { passive: false });
    const keyDown = (e: KeyboardEvent) => e.code === "Space" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) && setSpace(true);
    const keyUp = (e: KeyboardEvent) => e.code === "Space" && setSpace(false);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    return () => {
      resize.disconnect();
      el.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, []);

  // Ending the pen path: a lone starting point is not a shape.
  useEffect(() => {
    const current = pen.current;
    pen.current = null;
    if (!current) return;
    update((list) => list.filter((s) => !(s.id === current.id && s.kind === "path" && s.segs.length < 2)));
  }, [penStop, tool, style, update]);

  function toSvg(clientX: number, clientY: number): Pt {
    const el = svg.current!;
    const m = el.getScreenCTM()!.inverse();
    const p = new DOMPoint(clientX, clientY).matrixTransform(m);
    return { x: p.x, y: p.y };
  }

  function down(e: ReactPointerEvent<SVGSVGElement>) {
    if (e.button === 2) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const raw = toSvg(e.clientX, e.clientY);
    const target = e.target as SVGElement;

    if (e.button === 1 || space) {
      drag.current = { mode: "pan", client: { x: e.clientX, y: e.clientY }, view };
      return;
    }

    if (tool === "select") {
      const handle = target.dataset.handle;
      if (handle) {
        const [id, key] = handle.split("|");
        begin();
        onSelect(selected.includes(id) ? selected : [id], { id, key });
        drag.current = { mode: "handle", id, key };
        return;
      }
      const id = target.dataset.id;
      if (!id) {
        onSelect([], null);
        drag.current = null;
        return;
      }
      const ids = e.shiftKey ? (selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]) : selected.includes(id) ? selected : [id];
      onSelect(ids, null);
      begin();
      drag.current = { mode: "move", start: raw, originals: new Map(shapes.filter((s) => ids.includes(s.id)).map((s) => [s.id, s])) };
      return;
    }

    const p = snapPt(raw);
    if (tool === "pen") {
      const current = pen.current && shapes.find((s) => s.id === pen.current!.id);
      begin();
      if (!pen.current || !current || current.kind !== "path") {
        const id = newId();
        pen.current = { id, out: null, seg: 0 };
        update((list) => [...list, { id, kind: "path", segs: [{ c: "M", p }], attrs: {} }]);
        onSelect([id], null);
      } else {
        const first = (current.segs[0] as { p: Pt }).p;
        const out = pen.current.out;
        const closing = current.segs.length > 1 && Math.hypot(p.x - first.x, p.y - first.y) < 0.6;
        const target = closing ? first : p;
        const seg: Seg = out ? { c: "C", c1: out, c2: target, p: target } : { c: "L", p: target };
        const index = current.segs.length;
        update((list) => list.map((s) => (s.id === current.id && s.kind === "path" ? { ...s, d: undefined, segs: [...s.segs, seg, ...(closing ? [{ c: "Z" as const }] : [])] } : s)));
        if (closing) {
          pen.current = null;
          drag.current = null;
          return;
        }
        pen.current = { ...pen.current, out: null, seg: index };
      }
      drag.current = { mode: "pen", down: p };
      return;
    }

    const id = newId();
    begin();
    const shape: Shape =
      tool === "rect"
        ? { id, kind: "rect", x: p.x, y: p.y, w: 0, h: 0, r: 0, attrs: {} }
        : tool === "circle"
          ? { id, kind: "circle", cx: p.x, cy: p.y, r: 0, attrs: {} }
          : tool === "ellipse"
            ? { id, kind: "ellipse", cx: p.x, cy: p.y, rx: 0, ry: 0, attrs: {} }
            : { id, kind: "path", segs: [{ c: "M", p }, { c: "L", p }], attrs: {} };
    update((list) => [...list, shape]);
    onSelect([id], null);
    drag.current = { mode: "create", id, start: p, kind: tool };
  }

  function move(e: ReactPointerEvent<SVGSVGElement>) {
    const d = drag.current;
    if (!d) return;
    if (d.mode === "pan") {
      const k = d.view.size / px;
      onView({ ...d.view, x: d.view.x - (e.clientX - d.client.x) * k, y: d.view.y - (e.clientY - d.client.y) * k });
      return;
    }
    const raw = toSvg(e.clientX, e.clientY);
    const p = snapPt(raw);

    if (d.mode === "move") {
      const dx = snapV(raw.x - d.start.x);
      const dy = snapV(raw.y - d.start.y);
      update((list) => list.map((s) => (d.originals.has(s.id) ? translate(d.originals.get(s.id)!, dx, dy) : s)));
    } else if (d.mode === "handle") {
      update((list) => list.map((s) => (s.id === d.id ? moveHandle(s, d.key, p) : s)));
    } else if (d.mode === "create") {
      const a = d.start;
      update((list) =>
        list.map((s) => {
          if (s.id !== d.id) return s;
          if (s.kind === "rect") {
            const w = Math.abs(p.x - a.x);
            const h = Math.abs(p.y - a.y);
            return { ...s, x: Math.min(a.x, p.x), y: Math.min(a.y, p.y), w, h, r: Math.min(3, w / 2, h / 2) };
          }
          if (s.kind === "circle") return { ...s, r: snapV(Math.hypot(p.x - a.x, p.y - a.y)) };
          if (s.kind === "ellipse") return { ...s, cx: (a.x + p.x) / 2, cy: (a.y + p.y) / 2, rx: Math.abs(p.x - a.x) / 2, ry: Math.abs(p.y - a.y) / 2 };
          if (s.kind === "path") return { ...s, d: undefined, segs: [{ c: "M", p: a }, { c: "L", p }] };
          return s;
        }),
      );
    } else if (d.mode === "pen" && pen.current) {
      const { id, seg } = pen.current;
      if (Math.hypot(p.x - d.down.x, p.y - d.down.y) < 0.2) return;
      pen.current.out = p;
      const mirror = { x: 2 * d.down.x - p.x, y: 2 * d.down.y - p.y };
      if (seg === 0) return;
      update((list) =>
        list.map((s) => {
          if (s.id !== id || s.kind !== "path") return s;
          const segs = [...s.segs];
          const cur = segs[seg];
          const prev = segs[seg - 1];
          if (!cur || cur.c === "Z" || !prev || prev.c === "Z") return s;
          segs[seg] = { c: "C", c1: cur.c === "C" ? cur.c1 : prev.p, c2: mirror, p: cur.p };
          return { ...s, d: undefined, segs };
        }),
      );
    }
  }

  function up() {
    const d = drag.current;
    drag.current = null;
    if (d?.mode === "create") {
      update((list) =>
        list.filter((s) => {
          if (s.id !== d.id) return true;
          if (s.kind === "rect") return s.w > 0 && s.h > 0;
          if (s.kind === "circle") return s.r > 0;
          if (s.kind === "ellipse") return s.rx > 0 && s.ry > 0;
          if (s.kind === "path") {
            const [a, b] = anchors(s.segs);
            return Boolean(a && b && (a.x !== b.x || a.y !== b.y));
          }
          return true;
        }),
      );
    }
  }

  const rootAttrs = Object.entries(ROOT[style])
    .map(([k, v]) => ` ${k}="${v}"`)
    .join("");
  const icon = `<g${rootAttrs}>${shapes.map(shapeMarkup).join("")}</g>`;
  const fine = view.size < 10;
  const lines = Array.from({ length: fine ? 97 : 25 }, (_, i) => (fine ? i / 4 : i));
  const hit = Math.max(1.75, 12 * unit);
  const r = 4.5 * unit;
  const chosen = shapes.filter((s) => selected.includes(s.id));

  return (
    <svg
      ref={svg}
      className={styles.canvas}
      data-tool={space ? "pan" : tool}
      viewBox={`${view.x} ${view.y} ${view.size} ${view.size}`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onContextMenu={(e) => e.preventDefault()}
      role="application"
      aria-label="Icon canvas, 24 by 24"
    >
      <rect x="0" y="0" width="24" height="24" className={styles.board} />
      <g className={styles.gridLines}>
        {lines.map((v) => (
          <path key={v} d={`M${v} 0V24M0 ${v}H24`} data-major={v % 1 === 0 ? (v % 4 === 0 ? "4" : "1") : undefined} />
        ))}
      </g>
      <rect x="2" y="2" width="20" height="20" rx="0.5" className={styles.keyline} />
      <path d="M12 0V24M0 12H24" className={styles.center} />

      <g className={styles.icon} dangerouslySetInnerHTML={{ __html: icon }} />

      <g>
        {shapes.map((s) => {
          const d = toPathData(s);
          if (!d) return null;
          return (
            <path
              key={s.id}
              d={d}
              data-id={s.id}
              fill="none"
              stroke="transparent"
              strokeWidth={hit}
              pointerEvents={isFilled(s, style) ? "all" : "stroke"}
              className={styles.hit}
            />
          );
        })}
      </g>

      <g pointerEvents={tool === "select" && !space ? undefined : "none"}>
        {chosen.map((s) => {
          const d = toPathData(s);
          return (
            <g key={s.id}>
              {d && <path d={d} className={styles.outline} />}
              {handles(s).map((h) => (
                <g key={h.key}>
                  {h.to && <line x1={h.to.x} y1={h.to.y} x2={h.p.x} y2={h.p.y} className={styles.arm} />}
                  {h.type === "anchor" ? (
                    <rect
                      x={h.p.x - r}
                      y={h.p.y - r}
                      width={2 * r}
                      height={2 * r}
                      className={styles.anchor}
                      data-active={point?.id === s.id && point.key === h.key ? "" : undefined}
                      data-handle={`${s.id}|${h.key}`}
                    />
                  ) : (
                    <circle
                      cx={h.p.x}
                      cy={h.p.y}
                      r={r * 0.85}
                      className={styles.control}
                      data-active={point?.id === s.id && point.key === h.key ? "" : undefined}
                      data-handle={`${s.id}|${h.key}`}
                    />
                  )}
                </g>
              ))}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
