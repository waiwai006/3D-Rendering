import type { NextConfig } from "next";

const staticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(staticExport ? {
    output: "export" as const,
    images: { unoptimized: true },
    ...(basePath ? { basePath, assetPrefix: `${basePath}/` } : {}),
  } : {}),
};

export default nextConfig;
