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
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Biblioteka ikona</p>
          <h1 className={styles.title}>Vectilume</h1>
        </div>
        <p className={styles.lede}>
          Pretraži kolekcije, promijeni stil i boje, a klikom na ikonu otvori je na mreži 24 × 24.
          <span className={styles.count}>{total} ikona · outline, duotone, solid</span>
        </p>
        <nav className={styles.jump} aria-label="Sadržaj">
          {COLLECTIONS.map((collection) => (
            <a key={collection.id} href={`#${collection.id}`}>{collection.title}</a>
          ))}
          <a href="#context-heading">U sučelju</a>
          <a href="#release-heading">Objava na npm</a>
        </nav>
      </header>

      <div className={styles.toolbar} role="toolbar" aria-label="Postavke prikaza">
        <div className={styles.segmented} role="group" aria-label="Pozadina">
          {(["light", "dark"] as const).map((background) => (
            <button
              key={background}
              type="button"
              aria-pressed={theme.background === background}
              onClick={() => update({ background })}
            >
              {background === "light" ? "Svijetlo" : "Tamno"}
            </button>
          ))}
        </div>

        <label className={styles.control}>
          <span>Boja</span>
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
          <span>Primarna</span>
          <input type="color" value={theme.primary} onChange={(event) => update({ primary: event.target.value })} />
        </label>
        <label className={styles.control}>
          <span>Sekundarna</span>
          <input type="color" value={theme.secondary} onChange={(event) => update({ secondary: event.target.value })} />
        </label>
        <label className={styles.control}>
          <span>Debljina</span>
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
          Vrati
        </button>
      </div>

      {COLLECTIONS.map((collection, index) => (
        <Catalog
          key={collection.id}
          id={collection.id}
          eyebrow={`Kolekcija ${String(index + 1).padStart(2, "0")} · ${collection.items.length} ikona`}
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

      <ReleasePanel />

      <Inspector selection={selection} lookup={lookup} theme={theme} onClose={() => setSelection(null)} />
    </div>
  );
}

