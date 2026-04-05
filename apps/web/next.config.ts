import type { NextConfig } from "next";

const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:5000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  onDemandEntries: {
    // Keep routes warm longer in dev to reduce recompile stalls on navigation.
    maxInactiveAge: 1000 * 60 * 60,
    pagesBufferLength: 100,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
      // WebSocket /ws is proxied by dev-server.mjs (HTTP upgrades bypass rewrites)
    ];
  },
};

export default nextConfig;
