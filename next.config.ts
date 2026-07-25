import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@reown/appkit",
    "@reown/appkit-adapter-ethers",
    "@reown/appkit-common",
    "@reown/appkit-controllers",
    "@reown/appkit-scaffold-ui",
    "@reown/appkit-ui",
    "@reown/appkit-utils",
    "@reown/appkit-wallet",
  ],
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
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
