import type { MetadataRoute } from "next";

const BASE = "https://vectilume.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/request-icons", "/studio"].map((path) => ({ url: `${BASE}${path}` }));
}
