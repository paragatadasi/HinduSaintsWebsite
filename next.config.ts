import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typedRoutes: true,
  async headers() {
    const privateHeaders = [
      { key: "Cache-Control", value: "private, no-store, max-age=0" },
      { key: "CDN-Cache-Control", value: "private, no-store" },
      { key: "Surrogate-Control", value: "no-store" },
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet, noimageindex" }
    ];
    const privateSources = [
      "/admin/:path*",
      "/museumadmin/:path*",
      "/preview/:path*",
      "/api/admin/:path*"
    ];

    return privateSources.map((source) => ({ source, headers: privateHeaders }));
  },
  async redirects() {
    return [
      {
        source: "/admin/museum",
        destination: "/museumadmin",
        permanent: false
      },
      {
        source: "/admin/museum/:path*",
        destination: "/museumadmin/:path*",
        permanent: false
      }
    ];
  }
};

export default nextConfig;
