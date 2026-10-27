"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { IconShowcase } from "./IconShowcase";
import styles from "./Lab.module.css";
import { SIZES, STYLES, iconId, type IconLookup, type IconStyle } from "@/lib/icons";
import { themeVars, type Background, type Theme } from "@/lib/theme";
import { ReactPlayground } from "./ReactPlayground";

export interface Selection {
  collection: string;
  style: IconStyle;
  name: string;
  label: string;
  keywords: string[];
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
  const [copied, setCopied] = useState<string | null>(null);
  const [style, setStyle] = useState<IconStyle>(selection?.style ?? "outline");
  const [surface, setSurface] = useState<Background>(theme.background);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selection && !dialog.open) dialog.showModal();
    if (!selection && dialog.open) dialog.close();
    setCopied(null);
  }, [selection]);

  const svg = selection ? lookup[iconId(style, selection.name)] : undefined;

  const copy = async (what: string, text: string | undefined) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(what);
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
                {selection.collection} · {selection.name}
              </p>
              <h2 id="inspector-title">{selection.label}</h2>
              <ul className={styles.keywords} aria-label="Keywords">
                {selection.keywords.map((keyword) => <li key={keyword}>{keyword}</li>)}
              </ul>
            </div>
            <button type="button" className={styles.reset} onClick={onClose} autoFocus>
              Close
            </button>
          </header>

          <div className={styles.inspectorColumns}>
          <div className={styles.inspectorMain}>
          <div className={styles.segmented} role="group" aria-label="Icon style">
            {STYLES.map((option) => (
              <button key={option} type="button" aria-pressed={style === option} onClick={() => setStyle(option)}>
                {option[0].toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
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
              <button type="button" className={styles.reset} onClick={() => copy("svg", svg)} disabled={!svg}>
                {copied === "svg" ? "Copied" : "Copy SVG"}
              </button>
            </div>
            <pre>{svg ?? "Not drawn yet."}</pre>
          </div>

          <ReactPlayground name={selection.name} style={style} svg={svg} theme={theme} />
          </div>

          <div className={styles.inspectorUse}>
            <div className={styles.useHeader}>
              <h3>In use</h3>
              <div className={styles.segmented} role="group" aria-label="Preview background">
                {(["light", "dark"] as const).map((option) => (
                  <button key={option} type="button" aria-pressed={surface === option} onClick={() => setSurface(option)}>
                    {option === "light" ? "Light" : "Dark"}
                  </button>
                ))}
              </div>
            </div>
            <IconShowcase name={selection.name} label={selection.label} style={style} lookup={lookup} theme={theme} background={surface} />
          </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
