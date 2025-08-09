import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "pubquery-images.fra1.digitaloceanspaces.com", // ← add your DO Spaces bucket here
    ],
  },
  /* config options here */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, max-age=0",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
