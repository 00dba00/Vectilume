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

export const SIZES = [16, 20, 24, 32, 48];

export const icons = (manifest as { icons: ManifestIcon[] }).icons;

export type IconLookup = Record<string, string>;

export function buildLookup(list: ManifestIcon[]): IconLookup {
  return Object.fromEntries(list.map((icon) => [icon.id, icon.svg]));
}

export function iconId(style: IconStyle, name: string): string {
  return `${style}/${name}`;
}
