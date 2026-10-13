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
    id: "distinctive-gloss",
    label: "Distinctive · Gloss",
    summary: "A short highlight inside the top-left corner of every icon.",
  },
];

/** The 12 prototype icons from the plan. */
export const PROTOTYPE_ICONS = [
  "home", "car", "wallet", "calendar", "user", "settings",
  "search", "bell", "shield", "document", "chart", "heart",
];

export const SIZES = [16, 20, 24, 32, 48];

export const icons = (manifest as { icons: ManifestIcon[] }).icons;

export type IconLookup = Record<string, string>;

export function buildLookup(list: ManifestIcon[]): IconLookup {
  return Object.fromEntries(list.map((icon) => [icon.id, icon.svg]));
}

export function iconId(direction: string, style: IconStyle, name: string): string {
  return `${direction}/${style}/${name}`;
}
