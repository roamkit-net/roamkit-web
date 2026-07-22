import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
      {
        protocol: "https",
        hostname: "cdn.airalo.com",
      },
      {
        protocol: "https",
        hostname: "cdn-revamp.airalo.com",
      },
      {
        protocol: "https",
        hostname: "sandbox.airalo.com",
      },
    ],
  },
};

export default nextConfig;
