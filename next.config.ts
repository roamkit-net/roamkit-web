import type { NextConfig } from "next";

const AUTH_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://www.gstatic.com https://challenges.cloudflare.com",
  "frame-src https://accounts.google.com https://challenges.cloudflare.com",
  "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://api.staging.roamkit.net https://api.roamkit.net http://localhost:8000 http://127.0.0.1:8000",
].join("; ");

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
  async headers() {
    return [
      {
        source: "/login",
        headers: [{ key: "Content-Security-Policy", value: AUTH_CSP }],
      },
      {
        source: "/register",
        headers: [{ key: "Content-Security-Policy", value: AUTH_CSP }],
      },
    ];
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
