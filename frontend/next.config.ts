import type { NextConfig } from "next";

function buildRemotePatterns(): NonNullable<
  NextConfig["images"]
>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    {
      protocol: "https",
      hostname: "**.supabase.co",
      pathname: "/storage/v1/object/public/**",
    },
  ];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (apiUrl) {
    try {
      const parsed = new URL(apiUrl);

      patterns.push({
        protocol: parsed.protocol.replace(":", "") as "http" | "https",
        hostname: parsed.hostname,
        ...(parsed.port ? { port: parsed.port } : {}),
        pathname: "/api/assets/**",
      });
    } catch {
      // Ignore invalid environment values during build
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,

  images: {
    remotePatterns: buildRemotePatterns(),

    // Static export has no Next.js image optimization server.
    unoptimized: true,

    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;