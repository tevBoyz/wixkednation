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
  // Smaller Docker image: copies only the standalone server + traced deps.
  output: "standalone",

  async redirects() {
    return [
      {
        source: "/learn/is-weed-delivery-legal-virginia-dc",
        destination: "/learn/is-weed-delivery-legal-ohio",
        permanent: true,
      },
      {
        source: "/delivery/northern-virginia",
        destination: "/delivery/ohio",
        permanent: true,
      },
      {
        source: "/delivery/washington-dc",
        destination: "/delivery/ohio",
        permanent: true,
      },
      {
        source: "/delivery/virginia",
        destination: "/delivery/ohio",
        permanent: true,
      },
    ];
  },

  images: {
    remotePatterns: buildRemotePatterns(),

    // Local API (localhost:5000) resolves to private IPs; allow in development
    // so next/image can optimize when used. Production keeps the SSRF default.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
