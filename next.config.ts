import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typedRoutes: true,
  async headers() {
    const sharedCacheHeaders = [
      {
        key: "Cache-Control",
        value: "public, max-age=0, s-maxage=300, stale-while-revalidate=86400"
      },
      {
        key: "CDN-Cache-Control",
        value: "public, s-maxage=300, stale-while-revalidate=86400"
      },
      {
        key: "Surrogate-Control",
        value: "max-age=300, stale-while-revalidate=86400"
      }
    ];

    return [
      "/",
      "/about",
      "/contact",
      "/map",
      "/saints",
      "/saints/:path*",
      "/traditions",
      "/traditions/:path*",
      "/places/:path*"
    ].map((source) => ({
      source,
      headers: sharedCacheHeaders
    }));
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
