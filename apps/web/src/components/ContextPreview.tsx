"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import styles from "./Lab.module.css";
import { STYLES, iconId, type IconLookup, type IconStyle } from "@/lib/icons";
import { themeVars, type Background, type Theme } from "@/lib/theme";

interface ContextPreviewProps {
  lookup: IconLookup;
  theme: Theme;
}

const NAV = [
  { name: "home", label: "Overview" },
  { name: "wallet", label: "Payments" },
  { name: "calendar", label: "Schedule" },
  { name: "shield", label: "Security" },
];

const STATS = [
  { name: "wallet", label: "Balance", value: "€4,210" },
  { name: "calendar", label: "Due this week", value: "3 bills" },
  { name: "shield", label: "Protection", value: "Active" },
];

/** Mock app UI showing the icons at real UI sizes. */
export function ContextPreview({ lookup, theme }: ContextPreviewProps) {
  // null = mixed: each spot uses the style it would have in a real app
  const [only, setOnly] = useState<IconStyle | null>(null);
  const icon = (style: IconStyle, name: string) => lookup[iconId(only ?? style, name)];

  const app = (background: Background) => (
    <div
      key={background}
      className={styles.app}
      data-bg={background}
      style={themeVars({ ...theme, background, ink: theme.background === background ? theme.ink : null })}
    >
      <nav className={styles.appNav} aria-label={`Sample navigation (${background})`}>
        {NAV.map((item, index) => (
          <span key={item.name} className={styles.appNavItem} data-active={index === 0 || undefined}>
            <Icon svg={icon(index === 0 ? "solid" : "outline", item.name)} size={20} />
            {item.label}
          </span>
        ))}
      </nav>
      <div className={styles.appMain}>
        <div className={styles.appTop}>
          <strong>Overview</strong>
          <span className={styles.appButton}>
            <Icon svg={icon("outline", "calendar")} size={16} />
            New event
          </span>
        </div>
        <div className={styles.appStats}>
          {STATS.map((stat) => (
            <div key={stat.label} className={styles.appCard}>
              <Icon svg={icon("duotone", stat.name)} size={32} />
              <span className={styles.appCardLabel}>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
        <ul className={styles.appList}>
          {NAV.slice(1).map((item) => (
            <li key={item.name}>
              <Icon svg={icon("outline", item.name)} size={16} />
              {item.label} updated
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <section aria-labelledby="context-heading" className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 id="context-heading" className={styles.sectionTitle}>
          U sučelju
        </h2>
        <div className={styles.segmented} role="group" aria-label="Icon style">
          {[null, ...STYLES].map((style) => (
            <button key={style ?? "mixed"} type="button" aria-pressed={only === style} onClick={() => setOnly(style)}>
              {style ? style[0].toUpperCase() + style.slice(1) : "Mixed"}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.apps}>{(["light", "dark"] as const).map(app)}</div>
    </section>
  );
}
