"use client";

import { useMemo, useState } from "react";
import hobbies from "@vectilume/icons-svg/hobbies.json";
import { Icon } from "./Icon";
import type { Selection } from "./Inspector";
import { STYLES, iconId, type IconLookup, type IconStyle } from "@/lib/icons";
import { themeVars, type Theme } from "@/lib/theme";
import styles from "./HobbyCatalog.module.css";

interface HobbyCatalogProps {
  lookup: IconLookup;
  theme: Theme;
  onSelect: (selection: Selection) => void;
}

const groups = [...new Map(hobbies.map((item) => [item.group, item.groupLabel])).entries()];
const fold = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function HobbyCatalog({ lookup, theme, onSelect }: HobbyCatalogProps) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [style, setStyle] = useState<IconStyle>("outline");
  const visible = useMemo(() => {
    const search = fold(query.trim());
    return hobbies.filter((item) =>
      (group === "all" || item.group === group) &&
      (!search || fold(`${item.label} ${item.id} ${item.groupLabel}`).includes(search))
    );
  }, [query, group]);

  return (
    <section id="hobbies" className={styles.section} aria-labelledby="hobbies-heading">
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Kolekcija 01 · 140 ikona</p>
          <h2 id="hobbies-heading">Hobiji</h2>
          <p>Sport, glazba, stvaralaštvo i svakodnevne aktivnosti u tri Vectilume stila.</p>
        </div>
        <span className={styles.total}>{visible.length} / {hobbies.length}</span>
      </div>

      <div className={styles.controls}>
        <label className={styles.search}>
          <span>Pretraži hobije</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Npr. plivanje, karate, crtanje..." />
        </label>
        <div className={styles.styles} role="group" aria-label="Stil ikona">
          {STYLES.map((option) => (
            <button key={option} type="button" aria-pressed={style === option} onClick={() => setStyle(option)}>
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.groups} role="group" aria-label="Skupina hobija">
        <button type="button" aria-pressed={group === "all"} onClick={() => setGroup("all")}>Sve</button>
        {groups.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={group === id} onClick={() => setGroup(id)}>{label}</button>
        ))}
      </div>

      <div className={styles.grid} data-bg={theme.background} style={themeVars(theme)}>
        {visible.map((item) => (
          <button
            key={item.id}
            type="button"
            className={styles.card}
            onClick={() => onSelect({ direction: null, style, name: item.id })}
            aria-label={`Pregled ikone ${item.label}, ${style}`}
          >
            <Icon svg={lookup[iconId(null, style, item.id)]} size={40} />
            <span>{item.label}</span>
          </button>
        ))}
        {visible.length === 0 && <p className={styles.empty}>Nema hobija za ovaj upit.</p>}
      </div>
    </section>
  );
}
