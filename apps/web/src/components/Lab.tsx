"use client";

import { useState } from "react";
import { ContextPreview } from "./ContextPreview";
import { Icon } from "./Icon";
import { Inspector, type Selection } from "./Inspector";
import { HobbyCatalog } from "./HobbyCatalog";
import styles from "./Lab.module.css";
import { DIRECTIONS, PROTOTYPE_ICONS, STYLES, iconId, type IconLookup } from "@/lib/icons";
import { DEFAULT_THEME, themeVars, type Theme } from "@/lib/theme";

export function Lab({ lookup }: { lookup: IconLookup }) {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [selection, setSelection] = useState<Selection | null>(null);
  const update = (patch: Partial<Theme>) => setTheme((current) => ({ ...current, ...patch }));
  const drawn = Object.keys(lookup).length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Icon collections</p>
          <h1 className={styles.title}>Vectilume</h1>
        </div>
        <p className={styles.lede}>
          Explore icon sets across styles and sizes. Click an icon to inspect it on the 24 × 24 grid.
          <span className={styles.count}>{drawn} SVGs drawn</span>
        </p>
      </header>

      <div className={styles.toolbar} role="toolbar" aria-label="Preview settings">
        <div className={styles.segmented} role="group" aria-label="Background">
          {(["light", "dark"] as const).map((background) => (
            <button
              key={background}
              type="button"
              aria-pressed={theme.background === background}
              onClick={() => update({ background })}
            >
              {background === "light" ? "Light" : "Dark"}
            </button>
          ))}
        </div>

        <label className={styles.control}>
          <span>Ink</span>
          <input
            type="color"
            value={theme.ink ?? (theme.background === "light" ? "#1b1b1f" : "#ececf0")}
            onChange={(event) => update({ ink: event.target.value })}
          />
          {theme.ink && (
            <button type="button" className={styles.linkButton} onClick={() => update({ ink: null })}>
              auto
            </button>
          )}
        </label>
        <label className={styles.control}>
          <span>Primary</span>
          <input type="color" value={theme.primary} onChange={(event) => update({ primary: event.target.value })} />
        </label>
        <label className={styles.control}>
          <span>Secondary</span>
          <input type="color" value={theme.secondary} onChange={(event) => update({ secondary: event.target.value })} />
        </label>
        <label className={styles.control}>
          <span>Stroke</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.25}
            value={theme.stroke}
            onChange={(event) => update({ stroke: Number(event.target.value) })}
          />
          <output className={styles.value}>{theme.stroke.toFixed(2)}</output>
        </label>
        <button type="button" className={styles.reset} onClick={() => setTheme(DEFAULT_THEME)}>
          Reset
        </button>
      </div>

      <HobbyCatalog lookup={lookup} theme={theme} onSelect={setSelection} />

      <section aria-labelledby="compare-heading" className={styles.section}>
        <h2 id="compare-heading" className={styles.sectionTitle}>
          Original prototype · Distinctive Gloss
        </h2>
        <div className={styles.directions}>
          {DIRECTIONS.map((direction) => (
            <article key={direction.id} className={styles.direction}>
              <header className={styles.directionHeader}>
                <h3>{direction.label}</h3>
                <p>{direction.summary}</p>
              </header>
              <div className={styles.canvas} data-bg={theme.background} style={themeVars(theme)}>
                <div className={styles.sheet}>
                  <span />
                  {STYLES.map((style) => (
                    <span key={style} className={styles.columnLabel}>
                      {style}
                    </span>
                  ))}
                  {PROTOTYPE_ICONS.map((name) => (
                    <Row
                      key={name}
                      name={name}
                      direction={direction.id}
                      lookup={lookup}
                      onSelect={setSelection}
                    />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <ContextPreview lookup={lookup} theme={theme} />

      <Inspector selection={selection} lookup={lookup} theme={theme} onClose={() => setSelection(null)} />
    </div>
  );
}

interface RowProps {
  name: string;
  direction: string;
  lookup: IconLookup;
  onSelect: (selection: Selection) => void;
}

function Row({ name, direction, lookup, onSelect }: RowProps) {
  return (
    <>
      <span className={styles.rowLabel}>{name}</span>
      {STYLES.map((style) => {
        const svg = lookup[iconId(direction, style, name)];
        return (
          <button
            key={style}
            type="button"
            className={styles.cell}
            aria-label={`Inspect ${name} ${style}`}
            onClick={() => onSelect({ direction, style, name })}
          >
            <Icon svg={svg} size={48} />
            <span className={styles.ladder}>
              <Icon svg={svg} size={16} />
              <Icon svg={svg} size={24} />
              <Icon svg={svg} size={32} />
            </span>
          </button>
        );
      })}
    </>
  );
}
