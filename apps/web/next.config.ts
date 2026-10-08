import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@anime/domain", "@anime/contracts"],
  experimental: { useTypeScriptCli: false },
};

export default nextConfig;
