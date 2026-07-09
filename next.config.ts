import type { NextConfig } from "next";

const staticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const distDir = process.env.NEXT_BUILD_DIR || ".next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir,
  ...(staticExport ? {
    output: "export" as const,
    images: { unoptimized: true },
    ...(basePath ? { basePath, assetPrefix: `${basePath}/` } : {}),
  } : {}),
};

export default nextConfig;
