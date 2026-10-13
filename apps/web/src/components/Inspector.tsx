"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import styles from "./Lab.module.css";
import { DIRECTIONS, SIZES, iconId, type IconLookup, type IconStyle } from "@/lib/icons";
import { themeVars, type Theme } from "@/lib/theme";

export interface Selection {
  direction: string;
  style: IconStyle;
  name: string;
}

interface InspectorProps {
  selection: Selection | null;
  lookup: IconLookup;
  theme: Theme;
  onClose: () => void;
}

const GRID_LINES = Array.from({ length: 23 }, (_, i) => i + 1);

export function Inspector({ selection, lookup, theme, onClose }: InspectorProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selection && !dialog.open) dialog.showModal();
    if (!selection && dialog.open) dialog.close();
    setCopied(false);
  }, [selection]);

  const svg = selection ? lookup[iconId(selection.direction, selection.style, selection.name)] : undefined;
  const directionLabel = DIRECTIONS.find((direction) => direction.id === selection?.direction)?.label;

  const copy = async () => {
    if (!svg) return;
    await navigator.clipboard.writeText(svg);
    setCopied(true);
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.inspector}
      onClose={onClose}
      onClick={(event) => event.target === dialogRef.current && onClose()}
      aria-labelledby="inspector-title"
    >
      {selection && (
        <div className={styles.inspectorBody}>
          <header className={styles.inspectorHeader}>
            <div>
              <p className={styles.eyebrow}>
                {directionLabel} · {selection.style}
              </p>
              <h2 id="inspector-title">{selection.name}</h2>
            </div>
            <button type="button" className={styles.reset} onClick={onClose} autoFocus>
              Close
            </button>
          </header>

          <div className={styles.zoom} data-bg={theme.background} style={themeVars(theme)}>
            <Icon svg={svg} size={240} label={selection.name} />
            {showGrid && (
              <svg className={styles.grid} viewBox="0 0 24 24" aria-hidden="true">
                {GRID_LINES.map((i) => (
                  <g key={i} className={i === 12 ? styles.gridAxis : undefined}>
                    <line x1={i} y1={0} x2={i} y2={24} />
                    <line x1={0} y1={i} x2={24} y2={i} />
                  </g>
                ))}
                <rect className={styles.keyline} x={2} y={2} width={20} height={20} rx={2} />
                <circle className={styles.keyline} cx={12} cy={12} r={10} />
              </svg>
            )}
          </div>
          <label className={styles.checkbox}>
            <input type="checkbox" checked={showGrid} onChange={(event) => setShowGrid(event.target.checked)} />
            24 × 24 grid with 2 px keylines
          </label>

          {(["light", "dark"] as const).map((background) => (
            <div
              key={background}
              className={styles.sizeStrip}
              data-bg={background}
              style={themeVars({ ...theme, background, ink: theme.background === background ? theme.ink : null })}
            >
              {SIZES.map((size) => (
                <figure key={size}>
                  <Icon svg={svg} size={size} />
                  <figcaption>{size}</figcaption>
                </figure>
              ))}
            </div>
          ))}

          <div className={styles.source}>
            <div className={styles.sourceHeader}>
              <span>SVG source</span>
              <button type="button" className={styles.reset} onClick={copy} disabled={!svg}>
                {copied ? "Copied" : "Copy SVG"}
              </button>
            </div>
            <pre>{svg ?? "Not drawn yet."}</pre>
          </div>
        </div>
      )}
    </dialog>
  );
}
