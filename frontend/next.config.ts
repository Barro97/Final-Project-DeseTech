import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BACKEND:
      process.env.NEXT_PUBLIC_BACKEND || "http://localhost:8000",
  },
};

export default nextConfig;
