import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The studio runs the icon validator in the browser straight from the tooling sources.
  transpilePackages: ["@vectilume/tooling"],
};

export default nextConfig;
