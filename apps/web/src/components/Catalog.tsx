"use client";

import { useMemo, useState } from "react";
import { Icon } from "./Icon";
import type { Selection } from "./Inspector";
import { STYLES, iconId, type IconLookup, type IconStyle } from "@/lib/icons";
import { themeVars, type Theme } from "@/lib/theme";
import { catalogMatcher } from "@/lib/catalog-search";
import styles from "./Catalog.module.css";

export interface CatalogItem {
  id: string;
  label: string;
  group: string;
  groupLabel: string;
  keywords: string[];
  /** Former names of a renamed icon, still published as deprecated aliases. */
  aliases?: string[];
  glyph?: string;
  form?: string;
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

export function Catalog({ id, eyebrow, title, description, searchLabel, placeholder, items, lookup, theme, onSelect }: CatalogProps) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [style, setStyle] = useState<IconStyle>("outline");
  const [form, setForm] = useState(items.some((item) => item.form) ? "plain" : "all");
  const forms = useMemo(() => ["plain", "circle", "square"].filter((value) => items.some((item) => item.form === value)), [items]);
  const groups = useMemo(() => [...new Map(items.map((item) => [item.group, item.groupLabel])).entries()], [items]);
  const visible = useMemo(() => {
    const matches = catalogMatcher(query);
    return items.filter((item) => {
      if (group !== "all" && item.group !== group) return false;
      if (form !== "all" && item.form !== form) return false;
      return matches(item);
    });
  }, [items, query, group, form]);

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

      {forms.length > 0 && (
        <div className={styles.groups} role="group" aria-label="Character form">
          <button type="button" aria-pressed={form === "all"} onClick={() => setForm("all")}>All forms</button>
          {forms.map((value) => (
            <button key={value} type="button" aria-pressed={form === value} onClick={() => setForm(value)}>
              {value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      )}

      <div className={styles.grid} data-bg={theme.background} style={themeVars(theme)}>
        {visible.map((item) => (
          <button
            key={item.id}
            type="button"
            className={styles.card}
            onClick={() => onSelect({ collection: title, style, name: item.id, label: item.label, keywords: item.keywords, aliases: item.aliases })}
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
