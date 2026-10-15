import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "pub-f5cb81cf85a5471d9abf932f74d1ae0e.r2.dev" },
    ],
    qualities: [70, 75, 85],
  },
};

export default nextConfig;
