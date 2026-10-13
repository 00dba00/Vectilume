import manifest from "@vectilume/icons-svg/manifest.json";

export const STYLES = ["outline", "duotone", "solid"] as const;
export type IconStyle = (typeof STYLES)[number];

export interface ManifestIcon {
  id: string;
  direction: string | null;
  style: IconStyle;
  name: string;
  svg: string;
}

export interface Direction {
  id: string;
  label: string;
  summary: string;
}

export const DIRECTIONS: Direction[] = [
  {
    id: "soft-geometric",
    label: "Soft Geometric",
    summary: "Minimal, precise construction with gently rounded corners.",
  },
  {
    id: "modern-duotone",
    label: "Modern Duotone",
    summary: "Balanced two-tone planes; the secondary layer carries the shape.",
  },
  {
    id: "distinctive",
    label: "Distinctive · Spark",
    summary: "The top-right corner becomes a dot.",
  },
  { id: "distinctive-cut", label: "Distinctive · Cut", summary: "One corner sliced off; pointed tips are flattened." },
  { id: "distinctive-break", label: "Distinctive · Break", summary: "The top-right corner is left open." },
  { id: "distinctive-leaf", label: "Distinctive · Leaf", summary: "Top-left and bottom-right round, the other corners tight." },
  { id: "distinctive-gloss", label: "Distinctive · Gloss", summary: "A short highlight inside the top-left corner." },
  { id: "distinctive-overshoot", label: "Distinctive · Overshoot", summary: "One line runs past its corner like a construction line." },
];

/** Icons drawn in the first comparison round. */
export const PROTOTYPE_ICONS = ["home", "wallet", "calendar", "shield"];

export const SIZES = [16, 20, 24, 32, 48];

export const icons = (manifest as { icons: ManifestIcon[] }).icons;

export type IconLookup = Record<string, string>;

export function buildLookup(list: ManifestIcon[]): IconLookup {
  return Object.fromEntries(list.map((icon) => [icon.id, icon.svg]));
}

export function iconId(direction: string, style: IconStyle, name: string): string {
  return `${direction}/${style}/${name}`;
}
