import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@walletconnect/ethereum-provider'],
  },
};

export default nextConfig;
