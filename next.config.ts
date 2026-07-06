import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typedRoutes: true,
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
