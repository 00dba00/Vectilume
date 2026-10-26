"use client";

import { Icon } from "./Icon";
import { STYLES, iconId, type IconLookup, type IconStyle } from "@/lib/icons";
import { themeVars, type Background, type Theme } from "@/lib/theme";
import styles from "./IconShowcase.module.css";

interface IconShowcaseProps {
  name: string;
  label: string;
  style: IconStyle;
  lookup: IconLookup;
  theme: Theme;
  background: Background;
}

const TONES = [
  { name: "Ink", color: "var(--canvas-text)" },
  { name: "Primary", color: "var(--icon-primary)" },
  { name: "Success", color: "#16a34a" },
  { name: "Warning", color: "#d97706" },
  { name: "Danger", color: "#dc2626" },
  { name: "Muted", color: "var(--canvas-muted)" },
];

/** The selected icon placed in common UI patterns, so its weight and meaning can be judged in context. */
export function IconShowcase({ name, label, style, lookup, theme, background }: IconShowcaseProps) {
  const svg = (iconName: string, iconStyle: IconStyle = style) => lookup[iconId(iconStyle, iconName)];
  const icon = svg(name);
  const neighbours = ["home", "search", "bell"].filter((other) => other !== name).slice(0, 2);

  return (
    <div className={styles.showcase} data-bg={background} style={themeVars({ ...theme, background, ink: theme.background === background ? theme.ink : null })}>
      <section className={styles.block} aria-label="Styles">
        <h3>Styles</h3>
        <div className={styles.styleRow}>
          {STYLES.map((option) => (
            <figure key={option} data-active={option === style}>
              <Icon svg={svg(name, option)} size={40} />
              <figcaption>{option}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className={styles.block} aria-label="Buttons">
        <h3>Buttons</h3>
        <div className={styles.row}>
          <span className={styles.primaryButton}><Icon svg={icon} size={18} />{label}</span>
          <span className={styles.secondaryButton}><Icon svg={icon} size={18} />{label}</span>
          <span className={styles.ghostButton}><Icon svg={icon} size={16} />{label}</span>
        </div>
        <div className={styles.row}>
          {[{ box: 32, size: 16 }, { box: 40, size: 20 }, { box: 48, size: 24 }].map(({ box, size }) => (
            <span key={box} className={styles.iconButton} style={{ width: box, height: box }}><Icon svg={icon} size={size} /></span>
          ))}
          <span className={styles.fab}><Icon svg={icon} size={24} /></span>
        </div>
      </section>

      <section className={styles.block} aria-label="Navigation">
        <h3>Navigation</h3>
        <div className={styles.tabBar}>
          <span className={styles.tab} data-active="true"><Icon svg={icon} size={24} />{label}</span>
          {neighbours.map((other) => (
            <span key={other} className={styles.tab}><Icon svg={svg(other)} size={24} />{other[0].toUpperCase() + other.slice(1)}</span>
          ))}
        </div>
        <div className={styles.sidebar}>
          <span className={styles.sideItem} data-active="true"><Icon svg={icon} size={20} />{label}</span>
          <span className={styles.sideItem}><Icon svg={svg(neighbours[0] ?? "home")} size={20} />Overview</span>
        </div>
      </section>

      <section className={styles.block} aria-label="Lists and forms">
        <h3>Lists &amp; forms</h3>
        <div className={styles.listRow}>
          <span className={styles.tile}><Icon svg={icon} size={22} /></span>
          <span className={styles.listText}><strong>{label}</strong><small>Secondary line of text</small></span>
          <Icon svg={svg("chevron-right", "outline")} size={18} />
        </div>
        <label className={styles.input}>
          <Icon svg={icon} size={18} />
          <input placeholder={`Search ${label.toLowerCase()}…`} readOnly tabIndex={-1} />
        </label>
        <div className={styles.row}>
          <span className={styles.chip}><Icon svg={icon} size={14} />{label}</span>
          <span className={styles.badgeHost}><Icon svg={icon} size={24} /><span className={styles.badge}>3</span></span>
        </div>
      </section>

      <section className={styles.block} aria-label="Feedback">
        <h3>Feedback</h3>
        <div className={styles.toast}>
          <Icon svg={icon} size={20} />
          <span><strong>{label}</strong> · Something happened just now.</span>
        </div>
      </section>

      <section className={styles.block} aria-label="Colors">
        <h3>Colors</h3>
        <div className={styles.tones}>
          {TONES.map((tone) => (
            <figure key={tone.name} style={{ color: tone.color }}>
              <Icon svg={icon} size={28} />
              <figcaption>{tone.name}</figcaption>
            </figure>
          ))}
          <figure className={styles.onAccent}>
            <Icon svg={icon} size={28} />
            <figcaption>On accent</figcaption>
          </figure>
        </div>
      </section>
    </div>
  );
}
