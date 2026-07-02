import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Two deploy targets share this config:
  //  - Cloudflare Pages (default): no `output` — @cloudflare/next-on-pages
  //    transforms the build for the Edge Runtime.
  //  - Hostinger / any Node host: BUILD_STANDALONE=1 npm run build → a
  //    self-contained .next/standalone server.
  ...(process.env.BUILD_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
