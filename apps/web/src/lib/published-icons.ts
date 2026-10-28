import { cacheLife } from "next/cache";
import type { PublishedIcon } from "@/lib/icon-requests";

/** Icons of the latest @vectilume/icons on npm, which is what "done" means. */
export async function publishedIcons(): Promise<PublishedIcon[]> {
  "use cache";
  cacheLife("hours");
  const response = await fetch("https://unpkg.com/@vectilume/icons@latest/manifest.json");
  if (!response.ok) throw new Error(`unpkg answered ${response.status}`);
  return ((await response.json()) as { icons: PublishedIcon[] }).icons;
}
