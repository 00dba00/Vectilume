"use client";

import { useState } from "react";
import { ContextPreview } from "./ContextPreview";
import { Inspector, type Selection } from "./Inspector";
import { Catalog } from "./Catalog";
import { ReleasePanel } from "./ReleasePanel";
import styles from "./Lab.module.css";
import type { IconLookup } from "@/lib/icons";
import { COLLECTIONS } from "@/lib/collections";
import { DEFAULT_THEME, type Theme } from "@/lib/theme";

export function Lab({ lookup }: { lookup: IconLookup }) {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [selection, setSelection] = useState<Selection | null>(null);
  const update = (patch: Partial<Theme>) => setTheme((current) => ({ ...current, ...patch }));
  const total = COLLECTIONS.reduce((sum, collection) => sum + collection.items.length, 0);

  return (
    <>
      <header className={styles.hero}>
        <h1 className={styles.title}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG wordmark */}
          <img src="/brand/vectilume-logo-blueprint.svg" alt="Vectilume" width={1008} height={288} />
        </h1>
        <p className={styles.eyebrow}>Icon library · {total} icons · outline, duotone, solid</p>
        <p className={styles.lede}>
          Search the collections, switch styles and colors, and open any icon to see it on the 24 × 24 grid and in real UI.
        </p>
        <nav className={styles.jump} aria-label="Contents">
          {COLLECTIONS.map((collection) => (
            <a key={collection.id} href={`#${collection.id}`}>{collection.title}</a>
          ))}
          <a href="#context-heading">In context</a>
          <a href="/request-icons">Request an icon</a>
          {process.env.NODE_ENV === "development" && <a href="#release-heading">npm release</a>}
        </nav>
      </header>

      <div className={styles.page}>

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

        {COLLECTIONS.map((collection, index) => (
          <Catalog
            key={collection.id}
            id={collection.id}
            eyebrow={`Collection ${String(index + 1).padStart(2, "0")} · ${collection.items.length} icons`}
            title={collection.title}
            description={collection.description}
            searchLabel={collection.searchLabel}
            placeholder={collection.placeholder}
            items={collection.items}
            lookup={lookup}
            theme={theme}
            onSelect={setSelection}
          />
        ))}

        <ContextPreview lookup={lookup} theme={theme} />

        {/* Saving release settings writes to the repo, so the panel only exists on the local dev server. */}
        {process.env.NODE_ENV === "development" && <ReleasePanel />}

        <Inspector key={selection ? `${selection.collection}/${selection.name}` : "closed"} selection={selection} lookup={lookup} theme={theme} onClose={() => setSelection(null)} />
      </div>
    </>
  );
}

