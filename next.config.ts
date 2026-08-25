import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.96.127.157"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "huzxarkidhqceplxotjr.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;