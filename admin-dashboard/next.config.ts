import path from "path";
import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const API_ORIGIN = process.env.API_ORIGIN || "http://127.0.0.1:3000";

export default function nextConfig(phase: string): NextConfig {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  const config: NextConfig = {
    basePath: "/admin",
    trailingSlash: true,
    turbopack: {
      root: path.resolve(__dirname),
    },
    allowedDevOrigins: ["192.168.0.117", "127.0.0.1", "localhost"],
    images: {
      unoptimized: true,
    },
  };

  if (isDev) {
    config.rewrites = async () => [
      {
        source: "/api/:path*",
        destination: `${API_ORIGIN}/api/:path*`,
        basePath: false,
      },
      {
        source: "/uploads/:path*",
        destination: `${API_ORIGIN}/uploads/:path*`,
        basePath: false,
      },
      {
        source: "/public/:path*",
        destination: `${API_ORIGIN}/public/:path*`,
        basePath: false,
      },
    ];
  } else {
    config.output = "export";
  }

  return config;
}
