"use client";

import { useMemo, useState } from "react";
import { Icon } from "./Icon";
import type { Selection } from "./Inspector";
import { STYLES, iconId, type IconLookup, type IconStyle } from "@/lib/icons";
import { themeVars, type Theme } from "@/lib/theme";
import styles from "./Catalog.module.css";

export interface CatalogItem {
  id: string;
  label: string;
  group: string;
  groupLabel: string;
}

interface CatalogProps {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  searchLabel: string;
  placeholder: string;
  items: CatalogItem[];
  lookup: IconLookup;
  theme: Theme;
  onSelect: (selection: Selection) => void;
}

const fold = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function Catalog({ id, eyebrow, title, description, searchLabel, placeholder, items, lookup, theme, onSelect }: CatalogProps) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [style, setStyle] = useState<IconStyle>("outline");
  const groups = useMemo(() => [...new Map(items.map((item) => [item.group, item.groupLabel])).entries()], [items]);
  const visible = useMemo(() => {
    const search = fold(query.trim());
    return items.filter((item) =>
      (group === "all" || item.group === group) &&
      (!search || fold(`${item.label} ${item.id} ${item.groupLabel}`).includes(search))
    );
  }, [items, query, group]);

  return (
    <section id={id} className={styles.section} aria-labelledby={`${id}-heading`}>
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h2 id={`${id}-heading`}>{title}</h2>
          <p>{description}</p>
        </div>
        <span className={styles.total}>{visible.length} / {items.length}</span>
      </div>

      <div className={styles.controls}>
        <label className={styles.search}>
          <span>{searchLabel}</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} />
        </label>
        <div className={styles.styles} role="group" aria-label="Icon style">
          {STYLES.map((option) => (
            <button key={option} type="button" aria-pressed={style === option} onClick={() => setStyle(option)}>
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.groups} role="group" aria-label={`${title} groups`}>
        <button type="button" aria-pressed={group === "all"} onClick={() => setGroup("all")}>All</button>
        {groups.map(([groupId, label]) => (
          <button key={groupId} type="button" aria-pressed={group === groupId} onClick={() => setGroup(groupId)}>{label}</button>
        ))}
      </div>

      <div className={styles.grid} data-bg={theme.background} style={themeVars(theme)}>
        {visible.map((item) => (
          <button
            key={item.id}
            type="button"
            className={styles.card}
            onClick={() => onSelect({ collection: title, style, name: item.id, label: item.label })}
            aria-label={`Preview ${item.label}, ${style}`}
          >
            <Icon svg={lookup[iconId(style, item.id)]} size={40} />
            <span>{item.label}</span>
          </button>
        ))}
        {visible.length === 0 && <p className={styles.empty}>No icons match this search.</p>}
      </div>
    </section>
  );
}
