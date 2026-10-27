"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Icon } from "./Icon";
import styles from "./Lab.module.css";
import { SIZES, type IconStyle } from "@/lib/icons";
import { DEFAULT_SIZE, DEFAULT_STROKE, reactSnippet, type SnippetProps } from "@/lib/react-snippet";
import { bakeSvg } from "@/lib/bake-svg";
import { download, svgToPng } from "@/lib/export-icon";
import type { Theme } from "@/lib/theme";

interface ReactPlaygroundProps {
  name: string;
  style: IconStyle;
  svg: string | undefined;
  theme: Theme;
}

function Prop({ name, hint, children }: { name: string; hint: string; children: ReactNode }) {
  return (
    <div className={styles.propRow}>
      <div className={styles.propName}>
        <code>{name}</code>
        <small>{hint}</small>
      </div>
      <div className={styles.propControl}>{children}</div>
    </div>
  );
}

/** Try the @vectilume/react props on the selected icon and copy the matching JSX. */
export function ReactPlayground({ name, style, svg, theme }: ReactPlaygroundProps) {
  const [props, setProps] = useState<SnippetProps>({
    size: DEFAULT_SIZE,
    color: "",
    strokeWidth: DEFAULT_STROKE,
    primary: theme.primary,
    secondary: theme.secondary,
    title: "",
  });
  const [copied, setCopied] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const set = <K extends keyof SnippetProps>(key: K, value: SnippetProps[K]) => setProps((old) => ({ ...old, [key]: value }));
  const snippet = reactSnippet(name, style, props);

  const copy = async (what: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(null), 1500);
  };

  const file = `${name}-${style}`;
  const downloadSvg = () => svg && download(new Blob([svg], { type: "image/svg+xml" }), `${file}.svg`);
  const downloadPng = async (scale: number) => {
    if (!svg || !previewRef.current) return;
    const size = props.size * scale;
    // The preview's computed text colour is what currentColor resolves to on screen.
    const color = getComputedStyle(previewRef.current).color;
    const duotone = style === "duotone";
    const baked = bakeSvg(svg, {
      size,
      color,
      primary: duotone ? props.primary : "",
      secondary: duotone ? props.secondary : "",
      strokeWidth: props.strokeWidth,
    });
    download(await svgToPng(baked, size), `${file}-${size}px.png`);
  };

  // Mirrors what the component does: color sets currentColor, the duotone layers read the CSS variables.
  const preview = {
    color: props.color || undefined,
    "--icon-stroke": props.strokeWidth,
    "--icon-primary": style === "duotone" ? props.primary || undefined : undefined,
    "--icon-secondary": style === "duotone" ? props.secondary || undefined : undefined,
  } as CSSProperties;

  const color = (key: "color" | "primary" | "secondary", label: string) => (
    <div className={styles.swatch}>
      <label className={styles.swatchChip} data-empty={!props[key]} style={{ background: props[key] || undefined }}>
        <input type="color" aria-label={label} value={props[key] || "#000000"} onChange={(event) => set(key, event.target.value)} />
      </label>
      <code>{props[key] || "inherit"}</code>
      {props[key] && (
        <button type="button" className={styles.swatchClear} aria-label={`Clear ${label}`} onClick={() => set(key, "")}>
          ×
        </button>
      )}
    </div>
  );

  return (
    <section className={styles.playground} aria-label="React component">
      <div className={styles.playgroundHeader}>
        <h3>React</h3>
        <span className={styles.badge}>@vectilume/react</span>
      </div>

      <div ref={previewRef} className={styles.playgroundPreview} style={preview}>
        <Icon svg={svg} size={props.size} label={props.title || undefined} />
        <span className={styles.previewSize}>{props.size} px</span>
      </div>

      <div className={styles.downloads} role="group" aria-label="Download">
        <span>Download</span>
        <button type="button" onClick={downloadSvg} disabled={!svg}>
          SVG
        </button>
        <button type="button" onClick={() => downloadPng(1)} disabled={!svg}>
          PNG {props.size}px
        </button>
        <button type="button" onClick={() => downloadPng(2)} disabled={!svg}>
          PNG {props.size * 2}px <small>2×</small>
        </button>
      </div>

      <div className={styles.propList}>
        <Prop name="size" hint="width and height">
          <div className={styles.pills} role="group" aria-label="size">
            {SIZES.map((size) => (
              <button key={size} type="button" aria-pressed={props.size === size} onClick={() => set("size", size)}>
                {size}
              </button>
            ))}
          </div>
        </Prop>
        <Prop name="color" hint="sets currentColor">
          {color("color", "color")}
        </Prop>
        {style !== "solid" && (
          <Prop name="strokeWidth" hint="line weight">
            <div className={styles.slider}>
              <input
                type="range"
                aria-label="strokeWidth"
                min={1}
                max={2.5}
                step={0.25}
                value={props.strokeWidth}
                onChange={(event) => set("strokeWidth", Number(event.target.value))}
              />
              <output>{props.strokeWidth}</output>
            </div>
          </Prop>
        )}
        {style === "duotone" && (
          <Prop name="--icon-primary" hint="lines, via style">
            {color("primary", "--icon-primary")}
          </Prop>
        )}
        {style === "duotone" && (
          <Prop name="--icon-secondary" hint="fill layer, via style">
            {color("secondary", "--icon-secondary")}
          </Prop>
        )}
        <Prop name="title" hint="accessible name">
          <input
            type="text"
            className={styles.textInput}
            aria-label="title"
            value={props.title}
            placeholder="none: aria-hidden"
            onChange={(event) => set("title", event.target.value)}
          />
        </Prop>
      </div>

      <div className={styles.code}>
        <div className={styles.codeActions}>
          <button type="button" onClick={() => copy("import", snippet.importLine)}>
            {copied === "import" ? "Copied ✓" : "Copy import"}
          </button>
          <button type="button" data-primary onClick={() => copy("jsx", snippet.jsx)}>
            {copied === "jsx" ? "Copied ✓" : "Copy JSX"}
          </button>
        </div>
        <pre>
          <span className={styles.codeMuted}>{snippet.importLine}</span>
          {"\n\n"}
          {snippet.jsx}
        </pre>
      </div>
    </section>
  );
}
