import type { NextConfig } from "next";

const API_ORIGIN = process.env.API_ORIGIN || "http://127.0.0.1:3000";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.117", "127.0.0.1", "localhost"],
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_ORIGIN}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${API_ORIGIN}/uploads/:path*`,
      },
      {
        source: "/public/:path*",
        destination: `${API_ORIGIN}/public/:path*`,
      },
    ];
  },
};

export default nextConfig;
