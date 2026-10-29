"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { runChecks } from "@/lib/studio/checks";
import {
  editAnchor,
  exportSvg,
  handles,
  importSvg,
  keepGloss,
  moveHandle,
  newId,
  setClosed,
  shapeLabel,
  STYLES,
  toPath,
  translate,
  type IconStyle,
  type Shape,
} from "@/lib/studio/model";
import { Canvas, type PointRef, type Tool, type View } from "./Canvas";
import styles from "./studio.module.css";

type Docs = Record<IconStyle, Shape[]>;

export interface StudioIcon {
  id: string;
  label: string;
}

interface StudioProps {
  /** The opened library icon, or null for a new one. */
  opened: { id: string; sources: Record<IconStyle, string> } | null;
  library: StudioIcon[];
  /** Outline SVGs shown next to the icon in the preview. */
  neighbours: { id: string; svg: string }[];
  ui: Record<string, string>;
}

const TOOLS: { tool: Tool; label: string; key: string; icon?: string }[] = [
  { tool: "select", label: "Select", key: "V" },
  { tool: "pen", label: "Pen", key: "P", icon: "graphic-design" },
  { tool: "line", label: "Line", key: "L" },
  { tool: "rect", label: "Rectangle", key: "R" },
  { tool: "circle", label: "Circle", key: "C", icon: "circle" },
  { tool: "ellipse", label: "Ellipse", key: "E" },
];
const SIZES = [16, 20, 24, 32, 48];
const DRAFT = "vectilume-studio-draft";
const FIT: View = { x: -1, y: -1, size: 26 };
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const empty = (): Docs => ({ outline: [], duotone: [], solid: [] });

function load(opened: StudioProps["opened"]): { name: string; docs: Docs; error: string | null } {
  if (opened) {
    try {
      return { name: opened.id, docs: Object.fromEntries(STYLES.map((s) => [s, opened.sources[s] ? importSvg(opened.sources[s]) : []])) as Docs, error: null };
    } catch (e) {
      return { name: opened.id, docs: empty(), error: `Could not open ${opened.id}: ${(e as Error).message}` };
    }
  }
  return { name: "", docs: empty(), error: null };
}

const DUOTONE_LAYERS = {
  stroke: { label: "Primary stroke", attrs: {} },
  secondary: { label: "Secondary fill", attrs: { fill: "var(--icon-secondary, currentColor)", stroke: "none" } },
  primary: { label: "Primary fill", attrs: { fill: "var(--icon-primary, currentColor)", stroke: "none" } },
} as const;
const OUTLINE_LAYERS = {
  stroke: { label: "Stroke", attrs: {} },
  fill: { label: "Filled detail", attrs: { fill: "currentColor", stroke: "none" } },
} as const;

function layerOf(s: Shape, style: IconStyle): string {
  if (style === "duotone") return s.attrs.fill?.includes("secondary") ? "secondary" : s.attrs.fill?.includes("primary") ? "primary" : "stroke";
  return s.attrs.fill === "currentColor" ? "fill" : "stroke";
}
const withoutPaint = (attrs: Record<string, string>) => Object.fromEntries(Object.entries(attrs).filter(([k]) => k !== "fill" && k !== "stroke"));

export default function Studio({ opened, library, neighbours, ui }: StudioProps) {
  const router = useRouter();
  const initial = useMemo(() => load(opened), [opened]);
  const [name, setName] = useState(initial.name);
  const [hist, setHist] = useState({ docs: initial.docs, past: [] as Docs[], future: [] as Docs[] });
  const [style, setStyle] = useState<IconStyle>("outline");
  const [tool, setTool] = useState<Tool>("select");
  const [snap, setSnap] = useState(true);
  const [view, setView] = useState<View>(FIT);
  const [selected, setSelected] = useState<string[]>([]);
  const [point, setPoint] = useState<PointRef | null>(null);
  const [penStop, setPenStop] = useState(0);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(initial.error);
  const [open, setOpen] = useState("");
  const [copied, setCopied] = useState(false);
  const editingCode = useRef(false);

  const shapes = hist.docs[style];
  const svg = useMemo(() => exportSvg(shapes, style), [shapes, style]);
  // Checks measure paths point by point, so they follow the drawing a little behind instead of on every drag frame.
  const checked = useDeferredValue(useMemo(() => ({ svg, shapes, style }), [svg, shapes, style]));
  const checks = useMemo(() => runChecks(checked.svg, checked.shapes, checked.style), [checked]);
  const errors = checks.filter((c) => c.severity === "error").length;

  const begin = useCallback(() => setHist((h) => ({ docs: h.docs, past: [...h.past.slice(-99), h.docs], future: [] })), []);
  const update = useCallback(
    (fn: (list: Shape[]) => Shape[]) => setHist((h) => ({ ...h, docs: { ...h.docs, [style]: fn(h.docs[style]) } })),
    [style],
  );
  const apply = useCallback(
    (fn: (list: Shape[]) => Shape[]) => setHist((h) => ({ docs: { ...h.docs, [style]: fn(h.docs[style]) }, past: [...h.past.slice(-99), h.docs], future: [] })),
    [style],
  );
  const undo = useCallback(() => setHist((h) => (h.past.length ? { docs: h.past[h.past.length - 1], past: h.past.slice(0, -1), future: [h.docs, ...h.future] } : h)), []);
  const redo = useCallback(() => setHist((h) => (h.future.length ? { docs: h.future[0], past: [...h.past, h.docs], future: h.future.slice(1) } : h)), []);
  const select = useCallback((ids: string[], p: PointRef | null = null) => {
    setSelected(ids);
    setPoint(p);
  }, []);

  // A new icon picks up the last unsaved drawing; an opened one starts from the library.
  useEffect(() => {
    if (opened) return;
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT) ?? "null") as { name: string; svgs: Record<IconStyle, string>; gloss?: Record<IconStyle, number[]> } | null;
      if (!saved) return;
      const docs = Object.fromEntries(
        STYLES.map((s) => [s, (saved.svgs[s] ? importSvg(saved.svgs[s]) : []).map((shape, i) => (saved.gloss?.[s]?.includes(i) ? { ...shape, gloss: true } : shape))]),
      ) as Docs;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring browser storage once after mount
      setHist({ docs, past: [], future: [] });
      setName(saved.name);
    } catch {
      /* no draft or storage blocked */
    }
  }, [opened]);

  useEffect(() => {
    if (opened) return;
    const timer = setTimeout(() => {
      try {
        const svgs = Object.fromEntries(STYLES.map((s) => [s, hist.docs[s].length ? exportSvg(hist.docs[s], s) : ""]));
        const gloss = Object.fromEntries(STYLES.map((s) => [s, hist.docs[s].flatMap((shape, i) => (shape.gloss ? [i] : []))]));
        localStorage.setItem(DRAFT, JSON.stringify({ name, svgs, gloss }));
      } catch {
        /* storage blocked */
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [hist.docs, name, opened]);

  // Drawing writes the code; typing in the code redraws (below), without the two fighting.
  useEffect(() => {
    if (!editingCode.current) setCode(svg);
  }, [svg]);

  const typeCode = (value: string) => {
    setCode(value);
    try {
      const next = importSvg(value);
      begin();
      update((list) => keepGloss(next, list));
      setCodeError(null);
      setSelected([]);
      setPoint(null);
    } catch (e) {
      setCodeError((e as Error).message);
    }
  };

  const chosen = shapes.filter((s) => selected.includes(s.id));
  const one = chosen.length === 1 ? chosen[0] : null;
  const onSelected = useCallback((fn: (s: Shape) => Shape) => apply((list) => list.map((s) => (selected.includes(s.id) ? fn(s) : s))), [apply, selected]);

  const remove = useCallback(() => {
    if (point && one?.kind === "path") {
      apply((list) => list.map((s) => (s.id === point.id ? editAnchor(s, point.key, "delete") : s)));
      setPoint(null);
      return;
    }
    apply((list) => list.filter((s) => !selected.includes(s.id)));
    setSelected([]);
  }, [apply, one, point, selected]);

  const duplicate = useCallback(() => {
    const copies = shapes.filter((s) => selected.includes(s.id)).map((s) => ({ ...translate(s, 1, 1), id: newId() }));
    apply((list) => [...list, ...copies]);
    setSelected(copies.map((c) => c.id));
  }, [apply, selected, shapes]);

  const reorder = useCallback(
    (delta: number) =>
      apply((list) => {
        const out = [...list];
        const order = delta > 0 ? [...out.keys()].reverse() : [...out.keys()];
        for (const i of order) {
          const j = i + delta;
          if (selected.includes(out[i].id) && j >= 0 && j < out.length && !selected.includes(out[j].id)) [out[i], out[j]] = [out[j], out[i]];
        }
        return out;
      }),
    [apply, selected],
  );

  const nudge = useCallback(
    (dx: number, dy: number) => {
      if (point && one) {
        const h = handles(one).find((x) => x.key === point.key);
        if (h) apply((list) => list.map((s) => (s.id === one.id ? moveHandle(s, point.key, { x: h.p.x + dx, y: h.p.y + dy }) : s)));
        return;
      }
      onSelected((s) => translate(s, dx, dy));
    },
    [apply, one, onSelected, point],
  );

  const changeTool = (t: Tool) => {
    setTool(t);
    setPenStop((n) => n + 1);
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (mod && k === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && k === "y") {
        e.preventDefault();
        redo();
      } else if (mod && k === "d") {
        e.preventDefault();
        duplicate();
      } else if (k === "delete" || k === "backspace") {
        e.preventDefault();
        remove();
      } else if (k === "escape" || k === "enter") {
        setPenStop((n) => n + 1);
        if (k === "escape") select([]);
      } else if (k.startsWith("arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 1 : 0.25;
        nudge(k === "arrowleft" ? -step : k === "arrowright" ? step : 0, k === "arrowup" ? -step : k === "arrowdown" ? step : 0);
      } else if (k === "[" || k === "]") reorder(k === "]" ? 1 : -1);
      else if (!mod) {
        const t = TOOLS.find((x) => x.key.toLowerCase() === k);
        if (t) changeTool(t.tool);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [duplicate, nudge, redo, remove, reorder, select, undo]);

  const download = () => {
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name || "icon"}-${style}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const copy = async () => {
    await navigator.clipboard.writeText(svg);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const startNew = () => {
    if (hist.past.length && !window.confirm("Start a new icon? Unsaved changes here are lost.")) return;
    try {
      localStorage.removeItem(DRAFT);
    } catch {
      /* storage blocked */
    }
    if (opened) router.push("/studio");
    else {
      setHist({ docs: empty(), past: [], future: [] });
      setName("");
      select([]);
    }
  };
  const openIcon = (id: string) => {
    if (!library.some((i) => i.id === id)) return;
    if (hist.past.length && !window.confirm(`Open ${id}? Unsaved changes here are lost.`)) return;
    router.push(`/studio?icon=${id}`);
  };

  const g = (id: string, size = 18) => <Icon svg={ui[id]} size={size} />;
  const layers = style === "duotone" ? DUOTONE_LAYERS : OUTLINE_LAYERS;
  const handle = point && one ? handles(one).find((h) => h.key === point.key) : undefined;

  return (
    <div className={styles.studio}>
      <header className={styles.bar}>
        <Link href="/" className={styles.brand}>
          {g("sparkles", 22)} Vectilume <em>Studio</em>
        </Link>
        <label className={styles.field}>
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value.toLowerCase())} placeholder="new-icon" spellCheck={false} aria-invalid={name !== "" && !NAME.test(name)} />
        </label>
        <form
          className={styles.field}
          onSubmit={(e) => {
            e.preventDefault();
            openIcon(open.trim());
          }}
        >
          <span>Open</span>
          <input list="studio-library" value={open} onChange={(e) => setOpen(e.target.value)} placeholder="trash, home…" spellCheck={false} />
          <datalist id="studio-library">
            {library.map((i) => (
              <option key={i.id} value={i.id}>{i.label}</option>
            ))}
          </datalist>
        </form>
        <div className={styles.actions}>
          <button type="button" onClick={startNew} title="New icon">{g("file-plus")} New</button>
          <button type="button" onClick={undo} disabled={!hist.past.length} title="Undo (Ctrl+Z)">{g("undo")} Undo</button>
          <button type="button" onClick={redo} disabled={!hist.future.length} title="Redo (Ctrl+Shift+Z)">Redo</button>
          <button type="button" onClick={copy} title="Copy this style's SVG">{g("copy")} {copied ? "Copied" : "Copy SVG"}</button>
          <button type="button" onClick={download} className={styles.primary} title="Download this style">{g("download")} Download</button>
        </div>
      </header>

      <div className={styles.work}>
        <nav className={styles.tools} aria-label="Tools">
          {TOOLS.map((t) => (
            <button key={t.tool} type="button" aria-pressed={tool === t.tool} onClick={() => changeTool(t.tool)} title={`${t.label} (${t.key})`}>
              {t.icon ? g(t.icon, 20) : <span className={styles.toolText}>{t.label.slice(0, 4)}</span>}
              <kbd>{t.key}</kbd>
            </button>
          ))}
          <hr />
          <button type="button" aria-pressed={snap} onClick={() => setSnap((s) => !s)} title="Snap to 0.25">{g("grid", 20)}<kbd>snap</kbd></button>
          <button type="button" onClick={() => setView(FIT)} title="Fit the 24×24 board">{g("maximize", 20)}<kbd>fit</kbd></button>
        </nav>

        <section className={styles.stage}>
          <div className={styles.tabs} role="tablist" aria-label="Style">
            {STYLES.map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={style === s}
                onClick={() => {
                  setStyle(s);
                  select([]);
                }}
              >
                <span className={styles.tabIcon} dangerouslySetInnerHTML={{ __html: hist.docs[s].length ? exportSvg(hist.docs[s], s) : "" }} />
                {s}
                <small>{hist.docs[s].length}</small>
              </button>
            ))}
            <span className={styles.zoom}>{Math.round((26 / view.size) * 100)}%</span>
          </div>
          <div className={styles.board}>
            <Canvas
              shapes={shapes}
              style={style}
              tool={tool}
              snap={snap}
              view={view}
              selected={selected}
              point={point}
              onView={setView}
              onSelect={select}
              begin={begin}
              update={update}
              penStop={penStop}
            />
            {style !== "outline" && shapes.length === 0 && hist.docs.outline.length > 0 && (
              <div className={styles.emptyStyle}>
                <p>No {style} drawing yet.</p>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => apply(() => hist.docs.outline.map((s) => ({ ...s, id: newId(), attrs: style === "solid" ? withoutPaint(s.attrs) : s.attrs })))}
                >
                  Start from the outline
                </button>
              </div>
            )}
          </div>
          <p className={styles.hint}>
            Click a shape to select it, drag to move, drag the squares and dots to edit points. Pen: click for corners, drag for curves, click the first point to
            close, Enter to finish. Scroll to zoom, Space + drag to pan, arrows nudge 0.25 (Shift: 1).
          </p>

          <details className={styles.code} open>
            <summary>{g("code")} SVG code {codeError && <span className={styles.bad}>· {codeError}</span>}</summary>
            <textarea
              value={code}
              spellCheck={false}
              onFocus={() => (editingCode.current = true)}
              onBlur={() => {
                editingCode.current = false;
                setCode(svg);
              }}
              onChange={(e) => typeCode(e.target.value)}
              aria-label={`${style} SVG code`}
            />
          </details>
        </section>

        <aside className={styles.side}>
          <section className={styles.panel}>
            <h2>{g("sliders")} Inspector</h2>
            {!one ? (
              <p className={styles.muted}>{chosen.length > 1 ? `${chosen.length} shapes selected` : "Select a shape on the canvas or in Layers."}</p>
            ) : (
              <div className={styles.inspector}>
                <p className={styles.shapeName}>{shapeLabel(one)}</p>
                {one.kind === "rect" && (
                  <Fields shape={one} keys={[["x", "X"], ["y", "Y"], ["w", "W"], ["h", "H"], ["r", "Radius"]]} onChange={(patch) => onSelected((s) => ({ ...s, ...patch }) as Shape)} />
                )}
                {one.kind === "circle" && <Fields shape={one} keys={[["cx", "X"], ["cy", "Y"], ["r", "Radius"]]} onChange={(patch) => onSelected((s) => ({ ...s, ...patch }) as Shape)} />}
                {one.kind === "ellipse" && (
                  <Fields shape={one} keys={[["cx", "X"], ["cy", "Y"], ["rx", "RX"], ["ry", "RY"]]} onChange={(patch) => onSelected((s) => ({ ...s, ...patch }) as Shape)} />
                )}
                {handle && (
                  <div className={styles.pointBox}>
                    <p className={styles.muted}>{handle.type === "anchor" ? "Anchor" : "Handle"} point</p>
                    <Fields
                      shape={{ x: handle.p.x, y: handle.p.y }}
                      keys={[["x", "X"], ["y", "Y"]]}
                      onChange={(patch) => apply((list) => list.map((s) => (s.id === one.id ? moveHandle(s, point!.key, { ...handle.p, ...patch }) : s)))}
                    />
                    {one.kind === "path" && handle.type === "anchor" && (
                      <div className={styles.row}>
                        <button type="button" onClick={() => apply((list) => list.map((s) => (s.id === one.id ? editAnchor(s, point!.key, "curve") : s)))}>Curve</button>
                        <button type="button" onClick={() => apply((list) => list.map((s) => (s.id === one.id ? editAnchor(s, point!.key, "straight") : s)))}>Straight</button>
                        <button type="button" onClick={remove}>{g("trash", 16)} Point</button>
                      </div>
                    )}
                  </div>
                )}
                {one.kind === "path" && (
                  <label className={styles.check}>
                    <input type="checkbox" checked={one.segs.some((s) => s.c === "Z")} onChange={(e) => onSelected((s) => setClosed(s, e.target.checked))} />
                    Closed path
                  </label>
                )}
                {style !== "solid" ? (
                  <label className={styles.field}>
                    <span>Paint</span>
                    <select
                      value={layerOf(one, style)}
                      onChange={(e) => {
                        const next = (layers as Record<string, { attrs: Record<string, string> }>)[e.target.value].attrs;
                        onSelected((s) => ({ ...s, attrs: { ...withoutPaint(s.attrs), ...next } }));
                      }}
                    >
                      {Object.entries(layers).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={one.attrs["fill-rule"] === "evenodd"}
                      onChange={(e) =>
                        onSelected((s) => {
                          const { "fill-rule": _drop, ...rest } = s.attrs;
                          void _drop;
                          return { ...s, attrs: e.target.checked ? { "fill-rule": "evenodd", ...rest } : rest };
                        })
                      }
                    />
                    Cut out inner shapes (even-odd)
                  </label>
                )}
                {style !== "solid" && (
                  <label className={styles.check}>
                    <input type="checkbox" checked={Boolean(one.gloss)} onChange={(e) => onSelected((s) => ({ ...s, gloss: e.target.checked }))} />
                    {g("sparkles", 16)} Gloss highlight
                  </label>
                )}
                <div className={styles.row}>
                  {one.kind !== "path" && one.kind !== "raw" && (
                    <button type="button" onClick={() => onSelected(toPath)}>To path</button>
                  )}
                  <button type="button" onClick={duplicate} title="Ctrl+D">{g("copy", 16)} Duplicate</button>
                  <button type="button" onClick={remove} title="Delete">{g("trash", 16)} Delete</button>
                </div>
              </div>
            )}
          </section>

          <section className={styles.panel}>
            <h2>{g("layers")} Layers</h2>
            {shapes.length === 0 ? (
              <p className={styles.muted}>Empty. Pick a tool and draw on the board.</p>
            ) : (
              <>
                <ol className={styles.layers}>
                  {[...shapes].reverse().map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        aria-pressed={selected.includes(s.id)}
                        onClick={(e) => select(e.shiftKey ? (selected.includes(s.id) ? selected.filter((x) => x !== s.id) : [...selected, s.id]) : [s.id])}
                      >
                        {s.gloss && g("sparkles", 14)} {shapeLabel(s)}
                      </button>
                    </li>
                  ))}
                </ol>
                <div className={styles.row}>
                  <button type="button" onClick={() => reorder(1)} disabled={!selected.length} title="Bring forward (])">{g("arrow-up", 16)} Up</button>
                  <button type="button" onClick={() => reorder(-1)} disabled={!selected.length} title="Send backward ([)">{g("arrow-down", 16)} Down</button>
                </div>
              </>
            )}
          </section>

          <section className={styles.panel}>
            <h2>
              {g(errors ? "alert-triangle" : "badge-check")} Checks <span className={styles.count} data-bad={errors > 0 || undefined}>{checks.length}</span>
            </h2>
            {checks.length === 0 ? (
              <p className={styles.good}>All checks pass: grid, stroke, colours, keyline and Gloss.</p>
            ) : (
              <ul className={styles.checks}>
                {checks.map((c, i) => (
                  <li key={i} data-severity={c.severity}>
                    <button type="button" disabled={!c.shape} onClick={() => c.shape && select([c.shape])}>
                      <b>{c.rule}</b> {c.message}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.panel}>
            <h2>{g("eye")} Preview</h2>
            {(["light", "dark"] as const).map((bg) => (
              <div key={bg} className={styles.preview} data-bg={bg}>
                {SIZES.map((size) => (
                  <span key={size} title={`${size} px`} className={styles.previewIcon} style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} />
                ))}
              </div>
            ))}
            <div className={styles.neighbours} data-bg="light">
              {neighbours.slice(0, 3).map((n) => (
                <span key={n.id} title={n.id} dangerouslySetInnerHTML={{ __html: n.svg }} />
              ))}
              <span className={styles.current} title={name || "this icon"} dangerouslySetInnerHTML={{ __html: exportSvg(hist.docs.outline, "outline") }} />
              {neighbours.slice(3, 6).map((n) => (
                <span key={n.id} title={n.id} dangerouslySetInnerHTML={{ __html: n.svg }} />
              ))}
            </div>
            <p className={styles.muted}>Outline next to {opened ? "its neighbours in the collection" : "common icons"} at 24 px.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Fields<T extends object>({ shape, keys, onChange }: { shape: T; keys: [keyof T & string, string][]; onChange: (patch: Partial<T>) => void }) {
  return (
    <div className={styles.fields}>
      {keys.map(([key, label]) => (
        <label key={key} className={styles.field}>
          <span>{label}</span>
          <input
            type="number"
            step={0.25}
            value={Math.round(Number(shape[key]) * 100) / 100}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isNaN(v)) onChange({ [key]: v } as Partial<T>);
            }}
          />
        </label>
      ))}
    </div>
  );
}
