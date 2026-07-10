import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@supportflow/ui", "@supportflow/api-client"],
};

export default nextConfig;
