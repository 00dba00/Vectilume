import styles from "./Spinner.module.css";

interface SpinnerProps {
  size?: number;
  /** Shown under the canvas; screen readers hear it either way. */
  label?: string;
  showLabel?: boolean;
}

const V = "M5 6L12 19L19 6";
const ANCHORS = [
  [5, 6],
  [12, 19],
  [19, 6],
] as const;
const GRID = [6, 10, 14, 18];

/** A V being drawn on a 24×24 icon canvas: anchors, pen stroke, bezier handles, done, erase, again. CSS only. */
export function Spinner({ size = 48, label = "Loading…", showLabel = false }: SpinnerProps) {
  return (
    <span className={styles.spinner} role="status">
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <g className={styles.grid}>
          {GRID.map((g) => (
            <path key={g} d={`M${g} 1V23M1 ${g}H23`} />
          ))}
          <rect x="2" y="2" width="20" height="20" rx="1" className={styles.keyline} />
        </g>
        <path d={V} pathLength={1} className={styles.stroke} />
        <g className={styles.handles}>
          <path d="M8.5 19H15.5" />
          <circle cx="8.5" cy="19" r="0.8" />
          <circle cx="15.5" cy="19" r="0.8" />
        </g>
        {ANCHORS.map(([x, y], i) => (
          <rect key={i} x={x - 0.8} y={y - 0.8} width="1.6" height="1.6" className={styles.anchor} style={{ animationDelay: `${i * 70}ms` }} />
        ))}
        <g className={styles.pen}>
          {/* The Vectilume `edit` icon, scaled so its tip (3.5, 20.5) sits on the path. */}
          <g transform="scale(0.375) translate(-3.5 -20.5)">
            <path d="M3.5 20.5L8.45 19.09L20.05 7.49A2.5 2.5 0 0 0 16.51 3.95L4.91 15.55Z" />
            <path d="M4.91 15.55L8.45 19.09" />
            <path d="M13.89 6.57L17.43 10.11" />
          </g>
        </g>
      </svg>
      <span className={showLabel ? styles.label : styles.srOnly}>{label}</span>
    </span>
  );
}
