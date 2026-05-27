import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from Uploadthing and other services
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io", // Uploadthing CDN
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh", // Uploadthing regional CDN
      },
    ],
  },

  // Recommended for Vercel deployments
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;
