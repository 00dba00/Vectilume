import styles from "./Icon.module.css";

interface IconProps {
  svg: string | undefined;
  size: number;
  label?: string;
}

/** Renders a manifest SVG inline so it inherits color, CSS variables and stroke width. */
export function Icon({ svg, size, label }: IconProps) {
  const box = { width: size, height: size };
  if (!svg) {
    return <span className={styles.missing} style={box} title={label ? `${label} (missing)` : "missing"} />;
  }
  return (
    <span
      className={styles.icon}
      style={box}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
