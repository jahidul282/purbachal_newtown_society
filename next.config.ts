// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.hellopurbachal.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
