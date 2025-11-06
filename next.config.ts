import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed output: 'export' to allow for dynamic client-side data fetching
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
