import { cacheLife } from "next/cache";
import type { PublishedIcon } from "@/lib/icon-requests";

/** Icons of the latest @vectilume/icons on npm, uncached: the shipped emails need it right after a release. */
export async function latestPublishedIcons(): Promise<PublishedIcon[]> {
  const response = await fetch("https://unpkg.com/@vectilume/icons@latest/manifest.json");
  if (!response.ok) throw new Error(`unpkg answered ${response.status}`);
  return ((await response.json()) as { icons: PublishedIcon[] }).icons;
}

/** Icons of the latest @vectilume/icons on npm, which is what "done" means. */
export async function publishedIcons(): Promise<PublishedIcon[]> {
  "use cache";
  cacheLife("hours");
  return latestPublishedIcons();
}
